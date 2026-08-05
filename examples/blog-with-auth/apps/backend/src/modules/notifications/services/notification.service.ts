import type { z } from 'zod';

import { chunk, isEqual, omitBy } from 'es-toolkit';
import { v7 as uuidv7 } from 'uuid';

import { Prisma } from '@src/generated/prisma/client.js';
import { logError } from '@src/services/error-logger.js';
import { prisma } from '@src/services/prisma.js';
import { BadRequestError } from '@src/utils/http-errors.js';

import type {
  NotificationChannelKey,
  NotificationRoutingTarget,
} from '../channels/types.js';
import type {
  NotificationChannelSetting,
  NotificationMode,
  NotificationTopic,
  NotificationTopicKey,
} from '../constants/notification-topics.js';
import type {
  AnyNotificationType,
  BatchedNotificationType,
  NotificationParamsSchema,
  PlainNotificationType,
} from '../registry.js';
import type {
  NotificationParams,
  RenderContext,
  RenderedContent,
} from './notification-content.js';
import type { NotificationEvents } from './notification-events.js';
import type { NotificationOutbox } from './notification-outbox.js';
import type {
  NotificationRenderer,
  RenderSource,
} from './notification-renderer.js';

import { ROUTING_TARGETS } from '../channels/types.js';
import {
  getNotificationTopic,
  isNotificationTopicKey,
  isOutboundTarget,
  NOTIFICATION_TOPICS,
  resolveChannelSetting,
} from '../constants/notification-topics.js';
import { generatedKey } from '../registry.js';
import { GENERIC_NOTIFICATION_TYPE } from './generic-type.js';
import { toFrozenContent } from './notification-content.js';

/**
 * Rows per insert. Bounds every statement in the fan-out, so a large audience
 * is many bounded writes rather than one that grows without limit.
 */
const WRITE_CHUNK_SIZE = 500;

/** Recipients per badge-publish batch. */
const PUBLISH_CHUNK_SIZE = 100;

/**
 * How long a notification is kept before the retention worker deletes it.
 * One global window; there is no per-type override.
 */
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Every batch runs inside one interactive transaction, so this timeout — not
 * the batch size — is what caps the audience. Prisma's 5s default would fail a
 * merely large fan-out. Past a few thousand recipients use a fan-out worker
 * rather than raising this: a long transaction holds a pooled connection.
 */
const FANOUT_TRANSACTION_OPTIONS = { timeout: 30_000 };

/**
 * Digest window used when neither the preference row nor the topic names one.
 * Deliberately short: a project that wants hourly says so on the topic.
 */
const DEFAULT_DIGEST_WINDOW_SECONDS = 15 * 60;

/**
 * When a delivery row becomes eligible for a digest send, or null for an
 * immediate one.
 *
 * Written on insert and never updated, which is what makes "the first row opens
 * the window" true without any reconciliation: later rows in the same window
 * carry their own later due time, which is simply never consulted, because the
 * scan drains every pending row for the pair once the oldest comes due.
 */
function resolveDigestDueAt(entry: {
  mode: NotificationMode;
  digestWindowSeconds?: number;
}): Date | null {
  if (entry.mode !== 'digest') return null;
  const seconds = entry.digestWindowSeconds ?? DEFAULT_DIGEST_WINDOW_SECONDS;
  return new Date(Date.now() + seconds * 1000);
}

/** Unseen counts for a chunk. A recipient with none is absent from the map. */
async function countUnseenFor(
  recipientIds: string[],
): Promise<Map<string, number>> {
  const groups = await prisma.notification.groupBy({
    by: ['recipientId'],
    where: {
      recipientId: { in: recipientIds },
      inApp: true,
      dismissedAt: null,
      seenAt: null,
    },
    _count: { _all: true },
  });
  return new Map(groups.map((group) => [group.recipientId, group._count._all]));
}

/**
 * Whether stored params and freshly computed ones hold the same value.
 *
 * Compared structurally rather than by serializing: jsonb does not preserve key
 * order, so the two sides agree on content but not on layout. Undefined-valued
 * keys are dropped first, since the column drops them on write.
 */
function paramsMatch(
  stored: Prisma.JsonValue,
  computed: NotificationParams,
): boolean {
  return isEqual(
    stored,
    omitBy(computed, (value) => value === undefined),
  );
}

/**
 * The group key a call names, without resolving params.
 *
 * Separate from the params path because retraction needs only the key: running
 * a batched type's `resolveParams` here would read state to compute something
 * the caller then discards, and that read can legitimately fail — the fact
 * being withdrawn is often gone, which is why it is being withdrawn.
 */
function resolveGroupKey(
  type: AnyNotificationType,
  payload: { params?: NotificationParams; input?: unknown },
): string | undefined {
  return type.kind === 'batched'
    ? type.groupKey(type.inputSchema.parse(payload.input))
    : type.groupKey?.(type.paramsSchema.parse(payload.params));
}

/** True for Prisma's unique-constraint violation. */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/** Fields every notify call carries, whatever shape supplies the params. */
interface NotifyInputBase {
  recipientId: string;
}

/**
 * Resolve a call's payload into the params and group key the write paths take.
 *
 * The one place the two type shapes converge: a batched type computes its own
 * params from `input`, a plain type is handed them, and both derive their
 * group key from whichever of the two the type declared it over.
 */
async function resolvePayload(
  type: AnyNotificationType,
  payload: { params?: NotificationParams; input?: unknown },
): Promise<{ params: NotificationParams; groupKey: string | undefined }> {
  if (type.kind === 'batched') {
    const parsedInput: unknown = type.inputSchema.parse(payload.input);
    return {
      // No boundary: what is stored is current state. A delta belongs to a
      // single outbound send, which the outbox resolves at delivery.
      params: await type.resolveParams(parsedInput, { since: null }),
      groupKey: type.groupKey(parsedInput),
    };
  }
  const params = type.paramsSchema.parse(payload.params);
  return { params, groupKey: type.groupKey?.(params) };
}

/**
 * Input to trigger a notification.
 *
 * Note there is no `key`: the collapse key is derived by the type from what it
 * is given, never passed here. A call site that could write its own key could
 * write a different one on the retraction path, and the withdrawal would
 * silently miss.
 */
export type NotifyInput<T extends AnyNotificationType> = NotifyInputBase &
  NotifyPayload<T>;

/**
 * The params half of a notify call, by type shape.
 *
 * A plain type takes finished `params`; a batched type takes `input` and
 * computes params itself. Making this a union is what makes passing the wrong
 * one a compile error rather than a runtime surprise.
 */
export type NotifyPayload<T extends AnyNotificationType> =
  T extends BatchedNotificationType<NotificationParamsSchema, infer ISchema>
    ? { input: z.output<ISchema> }
    : T extends PlainNotificationType<infer PSchema>
      ? { params: z.output<PSchema> }
      : never;

/**
 * Input to notify many recipients from a single fan-out.
 *
 * Plain types only — see {@link NotificationService.notifyMany}.
 */
export interface NotifyManyInput<P extends NotificationParams> extends Omit<
  NotifyInputBase,
  'recipientId'
> {
  recipientIds: string[];
  params: P;
}

/** The dispatch a notify call created; the worker resolves it into deliveries. */
export interface NotifyResult {
  /**
   * Null when the call wrote nothing: a keyed notify whose recomputed state
   * matched what was already stored, so there was no dispatch to create.
   */
  requestId: string | null;
}

/** Result of a fan-out. */
export interface NotifyManyResult extends NotifyResult {
  /** Always written, so never null. */
  requestId: string;
  /** Rows written, across all channels. */
  createdCount: number;
}

/**
 * Input to withdraw a notification.
 *
 * Carries the same shape the `notify` call did, so the type derives the same
 * `groupKey` on both sides — which is the whole reason the key is not passed.
 */
export type RetractInput<T extends AnyNotificationType> = {
  recipientId: string;
} & NotifyPayload<T>;

/** Outcome of a retraction. */
export interface RetractResult {
  /**
   * False when there was nothing to withdraw — no row at that key, or one
   * already retracted. Retraction racing retention is benign, so this is a
   * return value rather than a throw.
   */
  retracted: boolean;
}

/** Input to withdraw a notification from every recipient holding it. */
export type RetractAllInput<T extends AnyNotificationType> = NotifyPayload<T>;

/** Outcome of a sweep. */
export interface RetractAllResult {
  /** Rows withdrawn. Zero when the fact was already gone from every feed. */
  retractedCount: number;
}

/** Options for the `notifyText` one-off sugar. */
export interface NotifyTextOptions {
  actionUrl?: string;
}

/** Result of a mutation that can change the unseen (badge) count. */
export interface UnseenCountResult {
  changed: boolean;
  /** The unseen count AFTER the change — the same value broadcast over pubsub. */
  unseenCount: number;
}

/** Result of a bulk mutation that can change the unseen (badge) count. */
export interface MarkNotificationsResult {
  changedCount: number;
  unseenCount: number;
}

/** Identifies a single preference row within a user. */
export interface PreferenceScope {
  topicKey: string;
  channel: NotificationRoutingTarget;
}

export type SetPreferenceInput = PreferenceScope & {
  mode: NotificationMode;
  /** Only stored for `digest`; absent inherits the topic's window. */
  digestWindowSeconds?: number;
};

/** One channel's resolved state for a topic. */
export interface NotificationChannelPreference extends NotificationChannelSetting {
  channel: NotificationRoutingTarget;
  /** True when no row exists and the setting came from the topic default. */
  isDefault: boolean;
}

/**
 * Where one recipient's copy of a notification goes.
 *
 * Outbound entries carry their mode rather than just the channel: `digest`
 * deliveries are armed the same way immediate ones are, and the outbox decides
 * when to send. The feed has no such split, so `inApp` stays a boolean.
 */
export interface RecipientRouting {
  inApp: boolean;
  outbound: {
    channel: NotificationChannelKey;
    mode: NotificationMode;
    /** The resolved window, carried only for `digest`. */
    digestWindowSeconds?: number;
  }[];
}

/** A topic as a settings page renders it. */
export interface NotificationTopicPreferences {
  key: NotificationTopicKey;
  label: string;
  description?: string;
  channels: NotificationChannelPreference[];
}

/**
 * The application-facing notifications capability: trigger, read, and
 * acknowledge notifications. Closes over {@link NotificationEvents} to
 * broadcast unseen-count changes and real-time updates.
 */
export interface NotificationService {
  /**
   * Trigger a notification. Takes the definition itself, so the payload is
   * checked against the renderer that will consume it.
   *
   * Whether the notification collapses is the type's choice, not the call's: a
   * type deriving a `groupKey` gets one row per (type, key, recipient),
   * replaced in place as the underlying fact evolves and withdrawable via
   * {@link NotificationService.retract}. A type deriving none writes a fresh row
   * per call.
   *
   * Returns the dispatch handle rather than a row: a notification is one
   * request that may materialize a row per recipient across several channels.
   */
  notify<T extends AnyNotificationType>(
    type: T,
    input: NotifyInput<T>,
  ): Promise<NotifyResult>;
  /**
   * Trigger one notification for many recipients: a single request plus a row
   * per recipient, with outbound delivery handed to the queue in chunks.
   *
   * Plain types only. A batched type resolves its params from input, which the
   * bulk path cannot do per recipient, and derives a `groupKey`, whose replace
   * semantics need a read-compare-write the bulk path also cannot do. Passing
   * one is a compile error.
   *
   * Fan-out is inline: the whole audience lands in one transaction, in bounded
   * batches. The batches bound each statement, not the transaction, so caller
   * latency and {@link FANOUT_TRANSACTION_OPTIONS} are what cap the audience —
   * past a few thousand recipients this wants a fan-out worker.
   *
   * A replay writes a second request but no second row for anyone already
   * notified: the type's `groupKey` (or the generated one) is unique per
   * recipient, so the row writes skip.
   *
   * Note the asymmetry with {@link NotificationService.notify}: a collapsing
   * type reached through this path skips an existing row rather than replacing
   * it, because the bulk path has no read-compare-write per recipient. Use
   * `notify` when the row must reflect new state.
   */
  notifyMany<PSchema extends NotificationParamsSchema>(
    type: PlainNotificationType<PSchema>,
    input: NotifyManyInput<z.output<PSchema>>,
  ): Promise<NotifyManyResult>;
  /**
   * Withdraw a notification whose triggering fact is gone — the last like was
   * undone, the comment was deleted.
   *
   * Settles any pending deliveries as `skipped`, so a debounced email that has
   * not left yet never leaves, and soft-deletes the row. An email already sent
   * cannot be recalled.
   *
   * The inverse of a collapsing {@link NotificationService.notify}: both are
   * writes against the same (type, groupKey, recipient) row, so a later notify
   * revives it rather than adding a second one. Returns `retracted: false` when
   * there is nothing there — racing retention is benign.
   *
   * Takes the same payload the notify call did rather than a key, so both sides
   * run the type's own `groupKey` and cannot disagree.
   */
  retract<T extends AnyNotificationType>(
    type: T,
    input: RetractInput<T>,
  ): Promise<RetractResult>;
  /**
   * Withdraw a notification from every recipient who holds it — the entity it
   * described is gone, so nobody's feed should still show it. Per recipient it
   * does what {@link NotificationService.retract} does.
   *
   * One indexed sweep: the group key is recipient-independent, so
   * `(type, groupKey)` is a prefix of the row unique and matches the whole
   * audience at once.
   *
   * Sized for bounded audiences; withdrawing thousands of rows wants a fan-out
   * worker instead. Only withdraws the type it is given, so a fact recorded
   * under a type nobody names survives its entity's deletion.
   */
  retractAll<T extends AnyNotificationType>(
    type: T,
    input: RetractAllInput<T>,
  ): Promise<RetractAllResult>;
  /**
   * Send a plain-text notification without defining a type, via the built-in
   * `generic` type. For one-off notifications ("Your export is ready").
   */
  notifyText(
    recipientId: string,
    text: string,
    options?: NotifyTextOptions,
  ): Promise<NotifyResult>;
  /**
   * Render a row's content at read time. Delegates to the injected
   * {@link NotificationRenderer}; see its docs for the version-pinning and
   * fallback rules.
   */
  renderContent(row: RenderSource, ctx?: RenderContext): RenderedContent;
  /**
   * Count of unseen notifications — the bell badge. Seen (opening the panel)
   * clears the badge; read (clicking one) clears its highlight. `readAt`
   * always implies `seenAt` (see the read mutations), so this never counts a
   * row already read.
   */
  getUnseenCount(userId: string): Promise<number>;
  /**
   * Count of unread notifications — the panel header. Unlike the unseen count,
   * opening the panel does not clear this; reading or dismissing a row does.
   */
  getUnreadCount(userId: string): Promise<number>;
  /**
   * Mark a notification read. Reading also marks it seen (a read row is never
   * unseen), so the badge can't count something already opened.
   */
  markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<UnseenCountResult>;
  /** Mark all of a user's unseen notifications seen (opening the bell). */
  markAllAsSeen(userId: string): Promise<MarkNotificationsResult>;
  /** Mark all of a user's notifications read (and therefore seen). */
  markAllAsRead(userId: string): Promise<MarkNotificationsResult>;
  /**
   * Soft-delete from the feed. Does not cancel pending deliveries. `changed`
   * is false if it didn't exist or was already dismissed.
   */
  dismiss(userId: string, notificationId: string): Promise<UnseenCountResult>;
  /** Subscribe to real-time unseen-count changes for a user. */
  subscribeToChanges(userId: string): AsyncIterable<{ count: number }>;
  /**
   * Record one channel choice for a topic, overriding the topic default.
   * Affects future fan-outs only — rows already written keep the routing they
   * were created with.
   */
  setPreference(userId: string, input: SetPreferenceInput): Promise<void>;
  /**
   * Drop a choice, restoring the topic default. False when there was no row.
   */
  clearPreference(userId: string, scope: PreferenceScope): Promise<boolean>;
  /**
   * Every declared topic with this user's resolved per-channel state, for a
   * settings page. Types outside every topic are deliberately absent: they
   * consult no preference, so there is nothing to render.
   */
  getPreferences(userId: string): Promise<NotificationTopicPreferences[]>;
}

async function getUnseenCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      recipientId: userId,
      inApp: true,
      dismissedAt: null,
      seenAt: null,
    },
  });
}

async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      recipientId: userId,
      inApp: true,
      dismissedAt: null,
      readAt: null,
    },
  });
}

/**
 * Record one channel choice, overriding the topic default.
 *
 * Deliberately does not publish an unseen count: a preference governs future
 * fan-outs, and rows already written keep the routing they were created with.
 */
async function setPreference(
  userId: string,
  input: SetPreferenceInput,
): Promise<void> {
  const { topicKey, channel, mode, digestWindowSeconds } = input;
  // Topic keys are a closed generated set, so an unknown one is a caller bug
  // rather than a row worth storing — unlike v4's type scope, every preference
  // now names something the generated const can confirm exists.
  if (!isNotificationTopicKey(topicKey)) {
    throw new BadRequestError(`Unknown notification topic: ${topicKey}`);
  }
  // The feed has no window to batch over, so `digest` is outbound-only.
  if (mode === 'digest' && !isOutboundTarget(channel)) {
    throw new BadRequestError(`Channel ${channel} cannot be digested`);
  }
  // Only meaningful for `digest`; storing it otherwise would resurrect a stale
  // window if the user later switched back.
  const window = mode === 'digest' ? (digestWindowSeconds ?? null) : null;
  await prisma.notificationPreference.upsert({
    where: { userId_topicKey_channel: { userId, topicKey, channel } },
    update: { mode, digestWindowSeconds: window },
    create: {
      userId,
      topicKey,
      channel,
      mode,
      digestWindowSeconds: window,
    },
  });
}

/**
 * Drop a choice, restoring the topic default. Returns false when there was no
 * row to clear.
 */
async function clearPreference(
  userId: string,
  scope: PreferenceScope,
): Promise<boolean> {
  // Scoped by the caller's id, so a wrong tuple clears nothing rather than
  // someone else's row.
  const { count } = await prisma.notificationPreference.deleteMany({
    where: { userId, ...scope },
  });
  return count > 0;
}

/**
 * Every declared topic with this user's resolved per-channel state — what a
 * settings page renders.
 */
async function getPreferences(
  userId: string,
): Promise<NotificationTopicPreferences[]> {
  const rows = await prisma.notificationPreference.findMany({
    where: { userId },
    select: {
      topicKey: true,
      channel: true,
      mode: true,
      digestWindowSeconds: true,
    },
  });
  const byTopic = new Map<string, Map<string, NotificationChannelSetting>>();
  for (const row of rows) {
    const byChannel =
      byTopic.get(row.topicKey) ??
      new Map<string, NotificationChannelSetting>();
    byChannel.set(row.channel, {
      mode: row.mode as NotificationMode,
      digestWindowSeconds: row.digestWindowSeconds ?? undefined,
    });
    byTopic.set(row.topicKey, byChannel);
  }

  return (NOTIFICATION_TOPICS as readonly NotificationTopic[]).map((topic) => {
    const overrides = byTopic.get(topic.key);
    return {
      key: topic.key as NotificationTopicKey,
      label: topic.label,
      description: topic.description,
      channels: ROUTING_TARGETS.map((channel) => {
        const override = overrides?.get(channel);
        return {
          channel,
          ...resolveChannelSetting(topic, channel, override),
          isDefault: override === undefined,
        };
      }),
    };
  });
}

/**
 * Creates the {@link NotificationService}. `events` and `renderer` are runtime
 * resources injected once at construction — feature code never touches pubsub
 * directly, and rendering stays a pure, separately-testable concern.
 */
export function createNotificationService(deps: {
  events: NotificationEvents;
  renderer: NotificationRenderer;
  outbox: NotificationOutbox;
}): NotificationService {
  const { events, renderer, outbox } = deps;

  /**
   * A type's routing ceiling: where it may go, before any user says otherwise.
   *
   * `channels` is optional on a type and defaults to every configured target,
   * so a type opts out of a channel rather than opting into all of them.
   */
  function routingCeiling(type: AnyNotificationType): {
    inApp: boolean;
    outbound: NotificationChannelKey[];
  } {
    const targets = type.channels ?? ROUTING_TARGETS;
    return {
      inApp: targets.includes('inApp'),
      outbound: outbox.installedChannels(targets),
    };
  }

  /**
   * Each recipient's routing after their preferences are applied.
   *
   * Resolved for the whole audience in one query before the fan-out transaction
   * opens: the transaction's budget is `FANOUT_TRANSACTION_OPTIONS.timeout`, so
   * a per-recipient query inside it would spend the audience cap on round trips.
   *
   * A topic-less type skips the query entirely and uses its ceiling verbatim.
   * That is the v5 replacement for `mandatory`: there is no preference row to
   * read because there is no topic to scope one to, so a security alert is
   * unsuppressible by construction rather than by a flag someone can flip.
   */
  async function resolveRouting(
    recipientIds: string[],
    type: AnyNotificationType,
  ): Promise<Map<string, RecipientRouting>> {
    const ceiling = routingCeiling(type);

    if (type.topic === undefined) {
      const routing: RecipientRouting = {
        inApp: ceiling.inApp,
        outbound: ceiling.outbound.map((channel) => ({
          channel,
          mode: 'immediate' as const,
        })),
      };
      return new Map(recipientIds.map((id) => [id, routing]));
    }

    const topic = getNotificationTopic(type.topic);

    // One unchunked read for the whole audience: it runs outside the
    // transaction, and rows exist only where someone has actually chosen, so
    // the result is far smaller than the recipient list.
    const preferences = await prisma.notificationPreference.findMany({
      where: { userId: { in: recipientIds }, topicKey: type.topic },
      select: {
        userId: true,
        channel: true,
        mode: true,
        digestWindowSeconds: true,
      },
    });

    // channel -> setting, per user. Absence means "use the topic default".
    const overrides = new Map<
      string,
      Map<string, NotificationChannelSetting>
    >();
    for (const row of preferences) {
      const byChannel =
        overrides.get(row.userId) ??
        new Map<string, NotificationChannelSetting>();
      byChannel.set(row.channel, {
        mode: row.mode as NotificationMode,
        digestWindowSeconds: row.digestWindowSeconds ?? undefined,
      });
      overrides.set(row.userId, byChannel);
    }

    function settingFor(
      recipientId: string,
      target: NotificationRoutingTarget,
    ): NotificationChannelSetting {
      return resolveChannelSetting(
        topic,
        target,
        overrides.get(recipientId)?.get(target),
      );
    }

    return new Map(
      recipientIds.map((recipientId) => [
        recipientId,
        {
          // The ceiling still wins: a preference can narrow where a type goes,
          // never widen it past what the type declared.
          inApp:
            ceiling.inApp && settingFor(recipientId, 'inApp').mode !== 'off',
          outbound: ceiling.outbound
            .map((channel) => {
              const setting = settingFor(recipientId, channel);
              return {
                channel,
                mode: setting.mode,
                digestWindowSeconds: setting.digestWindowSeconds,
              };
            })
            .filter((entry) => entry.mode !== 'off'),
        },
      ]),
    );
  }

  /** Recompute, broadcast the change, and return the unseen count for a user. */
  async function publishUnseenCount(userId: string): Promise<number> {
    const count = await getUnseenCount(userId);
    events.publishUnseenCount(userId, count);
    return count;
  }

  /**
   * Broadcast new badge counts for a fan-out's in-app recipients.
   *
   * Never throws: a failed publish costs a stale badge, not a lost row.
   */
  async function publishUnseenCounts(recipientIds: string[]): Promise<void> {
    if (recipientIds.length === 0) return;
    try {
      for (const batch of chunk(recipientIds, PUBLISH_CHUNK_SIZE)) {
        const counts = await countUnseenFor(batch);
        for (const recipientId of batch) {
          events.publishUnseenCount(recipientId, counts.get(recipientId) ?? 0);
        }
      }
    } catch (error) {
      logError(error, { source: 'notification-unseen-publish' });
    }
  }

  async function notifyMany<PSchema extends NotificationParamsSchema>(
    type: PlainNotificationType<PSchema>,
    input: NotifyManyInput<z.output<PSchema>>,
  ): Promise<NotifyManyResult> {
    const params = type.paramsSchema.parse(input.params);
    const recipientIds = [...new Set(input.recipientIds)];

    const frozen = renderer.renderForWrite(type, params);

    const routingByRecipient = await resolveRouting(recipientIds, type);

    // Row-only: `NotificationRequest` is disposable once its deliveries settle.
    const expiresAt = new Date(Date.now() + RETENTION_MS);

    const contentColumns = {
      type: type.key,
      templateVersion: type.version,
      params: params as Prisma.InputJsonValue,
      frozenContent: toFrozenContent(frozen),
    };

    // A `groupKey` for the whole fan-out, derived once from the params every
    // row shares. A type deriving none gets a per-request generated key below,
    // which collapses with nothing.
    const sharedGroupKey = type.groupKey?.(params);

    // The request, every recipient's row, and every delivery to make land
    // together.
    const { requestId, createdCount, inAppRecipientIds } =
      await prisma.$transaction(async (tx) => {
        // Always a fresh request: it is a dispatch record, not an idempotency
        // boundary. Replay safety rests on the row unique below instead, so a
        // replayed fan-out writes a second request but no second notification
        // for anyone who already has one.
        const request = await tx.notificationRequest.create({
          data: contentColumns,
        });

        // One row per recipient regardless of channel — an email-only
        // notification still gets one, with `inApp: false`, as does someone who
        // has silenced every channel. Chunked so no single statement grows with
        // the audience.
        let count = 0;
        for (const batch of chunk(recipientIds, WRITE_CHUNK_SIZE)) {
          const created = await tx.notification.createMany({
            data: batch.map((recipientId) => ({
              ...contentColumns,
              requestId: request.id,
              recipientId,
              // A type deriving no key gets one scoped to this request, so it
              // collapses with nothing and cannot be retracted — the
              // fire-and-forget default.
              groupKey: sharedGroupKey ?? generatedKey(request.id),
              feedSortKey: uuidv7(),
              inApp: routingByRecipient.get(recipientId)?.inApp ?? false,
              expiresAt,
            })),
            // A concurrent replay must short-circuit, not raise P2002.
            skipDuplicates: true,
          });
          count += created.count;
        }

        // Read back, not derived from the write: `createManyAndReturn` omits
        // rows it skipped, so a replay would return none of the ids needed.
        // Matched on the group key rather than this request's id: a replay
        // resolves to the rows the original request wrote, which carry a
        // different `requestId`.
        const groupKey = sharedGroupKey ?? generatedKey(request.id);
        const rows: {
          id: string;
          recipientId: string;
          inApp: boolean;
          feedSortKey: string;
        }[] = [];
        for (const batch of chunk(recipientIds, WRITE_CHUNK_SIZE)) {
          rows.push(
            ...(await tx.notification.findMany({
              where: {
                type: type.key,
                groupKey,
                recipientId: { in: batch },
              },
              select: {
                id: true,
                recipientId: true,
                inApp: true,
                feedSortKey: true,
              },
            })),
          );
        }

        // One row per (recipient, outbound channel), so one bounced address
        // fails its own row instead of a whole chunk. Keyed by recipient: a
        // channel someone has silenced produces no delivery for them.
        const deliveryData = rows.flatMap((row) =>
          (routingByRecipient.get(row.recipientId)?.outbound ?? []).map(
            (entry) => ({
              notificationId: row.id,
              requestId: request.id,
              // Denormalized from the notification so the digest scan can group
              // and settle by (recipient, channel) without a join.
              recipientId: row.recipientId,
              channel: entry.channel,
              mode: entry.mode,
              digestDueAt: resolveDigestDueAt(entry),
              // The generation this delivery serves. Constant for a
              // non-collapsing row, but carried so both write paths populate
              // the column the same way.
              feedSortKey: row.feedSortKey,
            }),
          ),
        );
        for (const batch of chunk(deliveryData, WRITE_CHUNK_SIZE)) {
          await tx.notificationDelivery.createMany({
            data: batch,
            skipDuplicates: true,
          });
        }

        return {
          requestId: request.id,
          createdCount: count,
          inAppRecipientIds: rows
            .filter((row) => row.inApp)
            .map((row) => row.recipientId),
        };
      }, FANOUT_TRANSACTION_OPTIONS);

    // In-app is published inline rather than queued: the row is already
    // committed, so the badge only needs the pubsub message.
    await publishUnseenCounts(inAppRecipientIds);

    try {
      await outbox.completeFanout(requestId);
    } catch (error) {
      // The notification is committed and the request stays `pending`, so the
      // sweeper finishes the hand-off. Failing the caller would imply nothing
      // was written.
      logError(error, { source: 'notification-fanout', requestId });
    }

    return { requestId, createdCount };
  }

  /**
   * Replace one keyed row, or leave it untouched when nothing really changed.
   *
   * Read-then-branch rather than a bare upsert: deciding whether this is a real
   * change needs the stored params to compare against, which an upsert's
   * `update` clause cannot see.
   */
  async function notifyDeduplicated(
    type: AnyNotificationType,
    input: NotifyInputBase & { params: NotificationParams; groupKey: string },
  ): Promise<NotifyResult> {
    const params = type.paramsSchema.parse(input.params);
    const { recipientId, groupKey } = input;

    const frozen = renderer.renderForWrite(type, params);

    const routingByRecipient = await resolveRouting([recipientId], type);
    const routing = routingByRecipient.get(recipientId) ?? {
      inApp: false,
      outbound: [],
    };

    const contentColumns = {
      type: type.key,
      templateVersion: type.version,
      params: params as Prisma.InputJsonValue,
      frozenContent: toFrozenContent(frozen),
    };

    const { requestId, changed, publishTo } = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.notification.findUnique({
          where: {
            type_groupKey_recipientId: {
              type: type.key,
              groupKey,
              recipientId,
            },
          },
          select: {
            id: true,
            params: true,
            feedSortKey: true,
            seenAt: true,
            dismissedAt: true,
          },
        });

        // Nothing really changed: the caller recomputed and got what is
        // already stored. Writing anyway would resurface the row, re-arm a
        // delivery and bump the badge for a non-event — which is exactly the
        // like/unlike/like oscillation this absorbs.
        //
        // A retracted row is never a no-op, however identical its params: the
        // fact came back (unlike then re-like), so the row has to be revived.
        if (
          existing?.dismissedAt === null &&
          paramsMatch(existing.params, params)
        ) {
          return { requestId: null, changed: false, publishTo: null };
        }

        const request = await tx.notificationRequest.create({
          data: contentColumns,
        });

        const expiresAt = new Date(Date.now() + RETENTION_MS);
        // Swap for node:crypto once it ships uuidv7.
        const feedSortKey = uuidv7();

        const row = existing
          ? await tx.notification.update({
              where: { id: existing.id },
              // Re-frozen from the new params — leaving the old snapshot would
              // make the fallback render a stale count.
              data: {
                ...contentColumns,
                requestId: request.id,
                inApp: routing.inApp,
                expiresAt,
                feedSortKey,
                // New activity, so the row is unacknowledged again. Clearing
                // `dismissedAt` is what revives a retracted row.
                seenAt: null,
                readAt: null,
                dismissedAt: null,
              },
              select: { id: true, feedSortKey: true },
            })
          : await tx.notification.create({
              data: {
                ...contentColumns,
                requestId: request.id,
                recipientId,
                groupKey,
                inApp: routing.inApp,
                expiresAt,
                feedSortKey,
              },
              select: { id: true, feedSortKey: true },
            });

        // One per channel per generation. `skipDuplicates` because a retry that
        // lands on the same generation must not arm a second send.
        if (routing.outbound.length > 0) {
          await tx.notificationDelivery.createMany({
            data: routing.outbound.map((entry) => ({
              notificationId: row.id,
              requestId: request.id,
              recipientId,
              channel: entry.channel,
              mode: entry.mode,
              digestDueAt: resolveDigestDueAt(entry),
              feedSortKey: row.feedSortKey,
            })),
            skipDuplicates: true,
          });
        }

        // Only when the badge could actually move: a brand new row always
        // bumps it, and so does one coming back from seen or retracted, but
        // replacing a row that is already unseen does not — its content updates
        // silently, so a busy thread stays one unseen row rather than bumping
        // the badge per event.
        const badgeMoved = existing
          ? existing.seenAt !== null || existing.dismissedAt !== null
          : true;

        return {
          requestId: request.id,
          changed: true,
          publishTo: routing.inApp && badgeMoved ? recipientId : null,
        };
      },
      FANOUT_TRANSACTION_OPTIONS,
    );

    if (!changed || requestId === null) {
      return { requestId: null };
    }

    if (publishTo) await publishUnseenCounts([publishTo]);

    try {
      await outbox.completeFanout(requestId);
    } catch (error) {
      logError(error, { source: 'notification-fanout', requestId });
    }

    return { requestId };
  }

  async function notify<T extends AnyNotificationType>(
    type: T,
    input: NotifyInput<T>,
  ): Promise<NotifyResult> {
    const { recipientId } = input;
    const { params, groupKey } = await resolvePayload(type, input);

    // No derived key: every call is its own row, so the bulk path's
    // single-recipient case is exactly right. Only a plain type gets here — a
    // batched type's `groupKey` is required — which the cast recovers.
    if (groupKey === undefined) {
      return notifyMany(type as PlainNotificationType, {
        recipientIds: [recipientId],
        params,
      });
    }

    const deduplicated = { recipientId, params, groupKey };
    try {
      return await notifyDeduplicated(type, deduplicated);
    } catch (error) {
      // Two first-writes for the same key raced: both read no row, both
      // created. The loser retries, now finding the winner's row and taking
      // the update branch. Last-writer-wins is correct here — both computed
      // from the same source of truth, so either result is current.
      if (isUniqueConstraintError(error)) {
        return await notifyDeduplicated(type, deduplicated);
      }
      throw error;
    }
  }

  async function retract<T extends AnyNotificationType>(
    type: T,
    input: RetractInput<T>,
  ): Promise<RetractResult> {
    const { recipientId } = input;
    // Key only: a withdrawal must not depend on the state it is withdrawing,
    // which for a batched type may already be gone.
    const groupKey = resolveGroupKey(type, input);

    // A type deriving no key writes a fresh row per call, so there is no single
    // row a withdrawal could name. A caller reaching here has misunderstood the
    // type, which is worth an error rather than a silent no-op.
    if (groupKey === undefined) {
      throw new BadRequestError(
        `Notification type "${type.key}" derives no group key, so it cannot be retracted.`,
      );
    }

    const { retracted, wasUnseen } = await prisma.$transaction(async (tx) => {
      const row = await tx.notification.findUnique({
        where: {
          type_groupKey_recipientId: { type: type.key, groupKey, recipientId },
        },
        select: { id: true, seenAt: true, dismissedAt: true },
      });

      // Nothing to withdraw. Racing retention, or a caller retracting twice —
      // both benign, so this reports rather than throws.
      if (row?.dismissedAt !== null) {
        return { retracted: false, wasUnseen: false };
      }

      // Anything still queued must not go out. In-flight jobs already skip
      // rows that are no longer `pending`, so a debounced email dies unsent;
      // one already delivered is settled and stays that way.
      await tx.notificationDelivery.updateMany({
        where: { notificationId: row.id, status: 'pending' },
        data: { status: 'skipped', lastError: 'retracted' },
      });

      // The existing soft delete, reused: every read path already filters
      // `dismissedAt`, so retraction cannot leave a row visible through a
      // filter someone forgot to add. A later notify at this key clears it.
      await tx.notification.update({
        where: { id: row.id },
        data: { dismissedAt: new Date() },
      });

      return { retracted: true, wasUnseen: row.seenAt === null };
    });

    if (wasUnseen) await publishUnseenCounts([recipientId]);

    return { retracted };
  }

  async function retractAll<T extends AnyNotificationType>(
    type: T,
    input: RetractAllInput<T>,
  ): Promise<RetractAllResult> {
    // Key only: the fact being withdrawn is usually already gone, so resolving
    // params would read state that no longer exists.
    const groupKey = resolveGroupKey(type, input);

    if (groupKey === undefined) {
      throw new BadRequestError(
        `Notification type "${type.key}" derives no group key, so it cannot be retracted.`,
      );
    }

    // Read outside the write transactions: holding one open across the whole
    // sweep would serialize it against every concurrent notify at these keys.
    const rows = await prisma.notification.findMany({
      where: { type: type.key, groupKey, dismissedAt: null },
      select: { id: true, recipientId: true, seenAt: true },
    });

    if (rows.length === 0) return { retractedCount: 0 };

    let retractedCount = 0;
    const unseenRecipientIds: string[] = [];

    // A chunk per transaction, so an interrupted sweep leaves some rows
    // withdrawn rather than none and the caller can simply run it again.
    for (const batch of chunk(rows, WRITE_CHUNK_SIZE)) {
      const notificationIds = batch.map((row) => row.id);

      const { count } = await prisma.$transaction(async (tx) => {
        // Anything still queued must not go out; one already delivered is
        // settled and stays that way.
        await tx.notificationDelivery.updateMany({
          where: { notificationId: { in: notificationIds }, status: 'pending' },
          data: { status: 'skipped', lastError: 'retracted' },
        });

        // Re-checked rather than trusted from the read above: a concurrent
        // retraction may have settled some of these and already published for
        // them.
        return tx.notification.updateMany({
          where: { id: { in: notificationIds }, dismissedAt: null },
          data: { dismissedAt: new Date() },
        });
      }, FANOUT_TRANSACTION_OPTIONS);

      retractedCount += count;
      unseenRecipientIds.push(
        ...batch.filter((row) => row.seenAt === null).map((r) => r.recipientId),
      );
    }

    await publishUnseenCounts(unseenRecipientIds);

    return { retractedCount };
  }

  function notifyText(
    recipientId: string,
    text: string,
    options: NotifyTextOptions = {},
  ): Promise<NotifyResult> {
    return notify(GENERIC_NOTIFICATION_TYPE, {
      recipientId,
      params: { text, actionUrl: options.actionUrl },
    });
  }

  /**
   * Returns the unseen count, broadcasting it first when `changed` — a no-op
   * mutation must not push a redundant update to every subscriber.
   */
  async function publishUnseenCountIfChanged(
    userId: string,
    changed: boolean,
  ): Promise<number> {
    return changed ? publishUnseenCount(userId) : getUnseenCount(userId);
  }

  async function markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<UnseenCountResult> {
    const now = new Date();
    // Read implies seen, so both writes land together or not at all.
    const [read] = await prisma.$transaction([
      prisma.notification.updateMany({
        where: { id: notificationId, recipientId: userId, readAt: null },
        data: { readAt: now },
      }),
      prisma.notification.updateMany({
        where: { id: notificationId, recipientId: userId, seenAt: null },
        data: { seenAt: now },
      }),
    ]);
    const changed = read.count > 0;
    const unseenCount = await publishUnseenCountIfChanged(userId, changed);
    return { changed, unseenCount };
  }

  async function markAllAsSeen(
    userId: string,
  ): Promise<MarkNotificationsResult> {
    const { count } = await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        inApp: true,
        dismissedAt: null,
        seenAt: null,
      },
      data: { seenAt: new Date() },
    });
    const unseenCount = await publishUnseenCountIfChanged(userId, count > 0);
    return { changedCount: count, unseenCount };
  }

  async function markAllAsRead(
    userId: string,
  ): Promise<MarkNotificationsResult> {
    const now = new Date();
    const feedScope = {
      recipientId: userId,
      inApp: true,
      dismissedAt: null,
    };
    const [read] = await prisma.$transaction([
      prisma.notification.updateMany({
        where: { ...feedScope, readAt: null },
        data: { readAt: now },
      }),
      prisma.notification.updateMany({
        where: { ...feedScope, seenAt: null },
        data: { seenAt: now },
      }),
    ]);
    const unseenCount = await publishUnseenCountIfChanged(
      userId,
      read.count > 0,
    );
    return { changedCount: read.count, unseenCount };
  }

  async function dismiss(
    userId: string,
    notificationId: string,
  ): Promise<UnseenCountResult> {
    const { count } = await prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId, dismissedAt: null },
      data: { dismissedAt: new Date() },
    });
    const changed = count > 0;
    const unseenCount = await publishUnseenCountIfChanged(userId, changed);
    return { changed, unseenCount };
  }

  function subscribeToChanges(userId: string): AsyncIterable<{
    count: number;
  }> {
    return events.subscribeToUnseenCount(userId);
  }

  return {
    notify,
    notifyMany,
    retract,
    retractAll,
    notifyText,
    renderContent: (row, ctx) => renderer.renderContent(row, ctx),
    getUnseenCount,
    getUnreadCount,
    markAsRead,
    markAllAsSeen,
    markAllAsRead,
    dismiss,
    subscribeToChanges,
    setPreference,
    clearPreference,
    getPreferences,
  };
}
