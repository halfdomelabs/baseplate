import { chunk, isEqual } from 'es-toolkit';

import { Prisma } from '@src/generated/prisma/client.js';
import { logError } from '@src/services/error-logger.js';
import { prisma } from '@src/services/prisma.js';
import { BadRequestError } from '@src/utils/http-errors.js';

import type { NotificationCategoryKey } from '../constants/notification-categories.js';
import type {
  NotificationChannelKey,
  NotificationRoutingTarget,
} from './notification-channel.js';
import type {
  NotificationParams,
  RenderContext,
  RenderedContent,
} from './notification-content.js';
import type { NotificationEvents } from './notification-events.js';
import type { NotificationOutbox } from './notification-outbox.js';
import type {
  NotificationActor,
  NotificationEvent,
  NotificationTypeDefinition,
} from './notification-registry.js';
import type {
  NotificationRenderer,
  RenderSource,
} from './notification-renderer.js';

import {
  getNotificationCategory,
  isNotificationCategoryKey,
  NOTIFICATION_CATEGORIES,
} from '../constants/notification-categories.js';
import { GENERIC_NOTIFICATION_TYPE } from './generic-type.js';
import { ROUTING_TARGETS } from './notification-channel.js';
import { generatedKey, isCallerKey } from './notification-registry.js';

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
 * Actor identity shared by the request and its rows. The `actorLabel` snapshot
 * lives only on {@link Notification}, so it is stamped per row rather than
 * added here.
 */
function actorColumns(input: { actorId?: string }): {
  actorKind: string;
  actorId: string | null;
} {
  return input.actorId
    ? { actorKind: 'user', actorId: input.actorId }
    : { actorKind: 'none', actorId: null };
}

/**
 * Params as the JSON column will read them back.
 *
 * Not a deep clone: the round-trip drops undefined-valued keys exactly as the
 * column does, which is what lets a stored value compare equal to the params a
 * later call recomputes.
 */
function asStoredJson(params: NotificationParams): Prisma.InputJsonValue {
  // eslint-disable-next-line unicorn/prefer-structured-clone -- structuredClone keeps undefined-valued keys; dropping them is the point.
  return JSON.parse(JSON.stringify(params)) as Prisma.InputJsonValue;
}

/** True for Prisma's unique-constraint violation. */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/** Input to trigger a notification. The type is the definition, not a key. */
export interface NotifyInput<P extends NotificationParams> {
  recipientId: string;
  params: P;
  actorId?: string;
  /**
   * Display name snapshotted onto the row, surviving a rename or deletion of
   * the actor. Also how a non-user actor is named, until system actors get a
   * locale-aware key lookup.
   */
  actorLabel?: string;
  /** Polymorphic subject reference (no FK). */
  entityType?: string;
  entityId?: string;
  /**
   * Stable identity of the FACT this notification is about
   * (`post:${postId}:likes`), unique per recipient.
   *
   * Passing one gives replace semantics: one row per (recipient, key),
   * rewritten in place by later calls, and retractable by the same key.
   *
   * The caller must then pass the WHOLE current state of the fact in `params`,
   * recomputed on every event that changes it — including events that shrink
   * it, like an unlike. This service stores what it is given; it never folds or
   * accumulates.
   *
   * Omit it for fire-and-forget notifications ("your export is ready").
   */
  key?: string;
}

/**
 * Input to notify many recipients from a single fan-out.
 *
 * `key` is omitted rather than rejected at runtime: replace semantics need a
 * read-compare-write per recipient, which the bulk path cannot do.
 */
export interface NotifyManyInput<P extends NotificationParams> extends Omit<
  NotifyInput<P>,
  'recipientId' | 'key'
> {
  recipientIds: string[];
  /**
   * Stable identity of this fan-out. A replay carrying the same one resolves to
   * the original request and writes no second copy for anyone in the audience.
   */
  idempotencyKey?: string;
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

/** Input to withdraw a notification. */
export interface RetractInput {
  recipientId: string;
  /** The same `key` the `notify` call carried. */
  key: string;
}

/** Outcome of a retraction. */
export interface RetractResult {
  /**
   * False when there was nothing to withdraw — no row at that key, or one
   * already retracted. Retraction racing retention is benign, so this is a
   * return value rather than a throw.
   */
  retracted: boolean;
}

/** Options for the `notifyText` one-off sugar. */
export interface NotifyTextOptions {
  actionUrl?: string;
  actorId?: string;
  actorLabel?: string;
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

/**
 * Which preferences a row governs.
 *
 * `category` is what a settings page edits; `type` is what inline affordances
 * ("stop notifying me about likes") write, and can only suppress within an
 * already-enabled category.
 */
export type NotificationPreferenceScopeKind = 'category' | 'type';

/** Identifies a single preference row within a user. */
export interface PreferenceScope {
  scopeKind: NotificationPreferenceScopeKind;
  /** A category key or a notification type key, per `scopeKind`. */
  scopeKey: string;
  channel: NotificationRoutingTarget;
}

export type SetPreferenceInput = PreferenceScope & { enabled: boolean };

/** One channel's resolved state for a category. */
export interface NotificationChannelPreference {
  channel: NotificationRoutingTarget;
  enabled: boolean;
  /** True when no row exists and `enabled` came from the category default. */
  isDefault: boolean;
}

/**
 * A category as a settings page renders it. `channels` is absent for a mandatory
 * category: it consults no preferences, so there is nothing to toggle.
 */
export interface NotificationCategoryPreferences {
  key: NotificationCategoryKey;
  label: string;
  mandatory: boolean;
  channels?: NotificationChannelPreference[];
}

/**
 * The application-facing notifications capability: trigger, read, and
 * acknowledge notifications. Closes over {@link NotificationEvents} to
 * broadcast unseen-count changes and real-time updates.
 */
export interface NotificationService {
  /**
   * Trigger a notification. Takes the definition itself, so `params` are
   * checked against the renderer that will consume them.
   *
   * Pass `input.key` to make the notification **keyed**: one row per
   * (recipient, key), replaced in place as the underlying fact evolves, and
   * withdrawable via {@link NotificationService.retract}. See `NotifyInput.key`
   * for the recompute contract that carries. Without a key each call is its own
   * row, as before.
   *
   * Returns the dispatch handle rather than a row: a notification is one
   * request that may materialize a row per recipient across several channels.
   */
  notify<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    input: NotifyInput<P>,
  ): Promise<NotifyResult>;
  /**
   * Trigger one notification for many recipients: a single request plus a row
   * per recipient, with outbound delivery handed to the queue in chunks.
   *
   * Fan-out is inline: the whole audience lands in one transaction, in bounded
   * batches. The batches bound each statement, not the transaction, so caller
   * latency and {@link FANOUT_TRANSACTION_OPTIONS} are what cap the audience —
   * past a few thousand recipients this wants a fan-out worker.
   *
   * Pass `input.idempotencyKey` to make a replay safe: it resolves to the
   * original request, and `@@unique(requestId, recipientId)` then makes the
   * row writes skip. Without one, a replayed fan-out notifies the audience
   * twice.
   */
  notifyMany<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    input: NotifyManyInput<P>,
  ): Promise<NotifyManyResult>;
  /**
   * Withdraw a notification whose triggering fact is gone — the last like was
   * undone, the comment was deleted.
   *
   * Settles any pending deliveries as `skipped`, so a debounced email that has
   * not left yet never leaves, and soft-deletes the row. An email already sent
   * cannot be recalled.
   *
   * The inverse of a keyed {@link NotificationService.notify}: both are writes
   * against the same (recipient, key) row, so a later notify at that key revives
   * it rather than adding a second one. Returns `retracted: false` when there is
   * nothing there — racing retention is benign.
   */
  retract<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    input: RetractInput,
  ): Promise<RetractResult>;
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
  renderContent(
    row: RenderSource,
    ctx?: RenderContext,
    actor?: NotificationActor,
  ): RenderedContent;
  /**
   * Count of UNSEEN notifications — the bell badge. Seen (opening the panel)
   * clears the badge; read (clicking one) clears its highlight. `readAt`
   * always implies `seenAt` (see the read mutations), so this never counts a
   * row already read.
   */
  getUnseenCount(userId: string): Promise<number>;
  /**
   * Count of UNREAD notifications — the panel header. Unlike the unseen count,
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
   * Record one channel choice for a category or a type, overriding the
   * category default. Affects future fan-outs only — rows already written keep
   * the routing they were created with.
   */
  setPreference(userId: string, input: SetPreferenceInput): Promise<void>;
  /**
   * Drop a choice, restoring the category default. False when there was no row.
   */
  clearPreference(userId: string, scope: PreferenceScope): Promise<boolean>;
  /**
   * Every declared category with this user's resolved per-channel state, for a
   * settings page. Category-scoped only: type rows are not surfaced here.
   */
  getPreferences(userId: string): Promise<NotificationCategoryPreferences[]>;
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
 * Record one channel choice, overriding the category default.
 *
 * Deliberately does not publish an unseen count: a preference governs future
 * fan-outs, and rows already written keep the routing they were created with.
 */
async function setPreference(
  userId: string,
  input: SetPreferenceInput,
): Promise<void> {
  const { scopeKind, scopeKey, channel, enabled } = input;
  // Category keys are a closed generated set, so an unknown one is a caller
  // bug. Type keys are not checked: a preference may legitimately be written
  // for a type registered by a later deploy, and an unmatched row is inert.
  if (scopeKind === 'category' && !isNotificationCategoryKey(scopeKey)) {
    throw new BadRequestError(`Unknown notification category: ${scopeKey}`);
  }
  await prisma.notificationPreference.upsert({
    where: {
      userId_scopeKind_scopeKey_channel: {
        userId,
        scopeKind,
        scopeKey,
        channel,
      },
    },
    update: { enabled },
    create: { userId, scopeKind, scopeKey, channel, enabled },
  });
}

/**
 * Drop a choice, restoring the category default. Returns false when there was
 * no row to clear.
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
 * Every declared category with this user's resolved per-channel state — what a
 * settings page renders.
 *
 * Category-scoped only: type rows are written by inline affordances ("stop
 * notifying me about likes") and are not shown here, so a category cannot
 * appear off because some unrelated type was muted.
 */
async function getPreferences(
  userId: string,
): Promise<NotificationCategoryPreferences[]> {
  const rows = await prisma.notificationPreference.findMany({
    where: { userId, scopeKind: 'category' },
    select: { scopeKey: true, channel: true, enabled: true },
  });
  const byCategory = new Map<string, Map<string, boolean>>();
  for (const row of rows) {
    const byChannel =
      byCategory.get(row.scopeKey) ?? new Map<string, boolean>();
    byChannel.set(row.channel, row.enabled);
    byCategory.set(row.scopeKey, byChannel);
  }

  return NOTIFICATION_CATEGORIES.map((category) => {
    // A mandatory category consults no preferences at all, and its defaults
    // are not read either — the type's own `channels` decide. Reporting
    // channel state would invite a settings page to render a toggle that
    // cannot do anything.
    if (category.mandatory) {
      return { key: category.key, label: category.label, mandatory: true };
    }
    const overrides = byCategory.get(category.key);
    const defaults = new Set<string>(category.defaultChannels);
    return {
      key: category.key,
      label: category.label,
      mandatory: false,
      channels: ROUTING_TARGETS.map((channel) => {
        const override = overrides?.get(channel);
        return {
          channel,
          enabled: override ?? defaults.has(channel),
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
   * How a type is delivered, split by mechanism: in-app is a flag on the row
   * plus an inline publish, outbound channels are queued jobs.
   */
  function resolveRouting(type: NotificationTypeDefinition): {
    inApp: boolean;
    outbound: NotificationChannelKey[];
  } {
    return {
      inApp: type.channels.includes('inApp'),
      outbound: outbox.installedChannels(type.channels),
    };
  }

  /**
   * Each recipient's routing after their preferences are applied.
   *
   * Resolved for the whole audience in one query BEFORE the fan-out transaction
   * opens: the transaction's budget is `FANOUT_TRANSACTION_OPTIONS.timeout`, so
   * a per-recipient query inside it would spend the audience cap on round trips.
   *
   * Both scopes are read together and combined as an AND — a type row can only
   * narrow within an enabled category, never re-enable a disabled one. That way
   * a settings page showing "Comments: off" cannot be silently contradicted by a
   * type-scoped row, while "comments on, likes off" is still expressible.
   */
  async function resolveEffectiveChannels(
    recipientIds: string[],
    type: NotificationTypeDefinition,
  ): Promise<
    Map<string, { inApp: boolean; outbound: NotificationChannelKey[] }>
  > {
    const routing = resolveRouting(type);
    const category = getNotificationCategory(type.category);

    // Mandatory categories are not the user's choice, so their rows are never
    // read — skipping the query entirely rather than reading and discarding.
    if (category.mandatory) {
      return new Map(recipientIds.map((id) => [id, routing]));
    }

    // One unchunked read for the whole audience: it runs outside the
    // transaction, and rows exist only where someone has actually chosen, so
    // the result is far smaller than the recipient  list.
    const preferences = await prisma.notificationPreference.findMany({
      where: {
        userId: { in: recipientIds },
        // One query covering both scopes; `scopeKind` disambiguates a category
        // and a type that happen to share a key.
        scopeKey: { in: [type.category, type.key] },
      },
      select: {
        userId: true,
        scopeKind: true,
        scopeKey: true,
        channel: true,
        enabled: true,
      },
    });

    // channel -> enabled, per user, per scope. Absence means "no opinion".
    const categoryRows = new Map<string, Map<string, boolean>>();
    const typeRows = new Map<string, Map<string, boolean>>();
    for (const row of preferences) {
      const scoped =
        row.scopeKind === 'category' && row.scopeKey === type.category
          ? categoryRows
          : row.scopeKind === 'type' && row.scopeKey === type.key
            ? typeRows
            : undefined;
      if (!scoped) continue;
      const byChannel = scoped.get(row.userId) ?? new Map<string, boolean>();
      byChannel.set(row.channel, row.enabled);
      scoped.set(row.userId, byChannel);
    }

    // Widened to `string` for the lookup: preference rows hold whatever was
    // written, so a row for a since-removed channel must miss rather than fail.
    const defaultChannels = new Set<string>(category.defaultChannels);

    function isAllowed(
      recipientId: string,
      target: NotificationRoutingTarget,
    ): boolean {
      const categoryEnabled =
        categoryRows.get(recipientId)?.get(target) ??
        defaultChannels.has(target);
      // Type rows are pure suppression: no row means "no objection", not "on".
      const typeEnabled = typeRows.get(recipientId)?.get(target) ?? true;
      return categoryEnabled && typeEnabled;
    }

    return new Map(
      recipientIds.map((recipientId) => [
        recipientId,
        {
          inApp: routing.inApp && isAllowed(recipientId, 'inApp'),
          outbound: routing.outbound.filter((channel) =>
            isAllowed(recipientId, channel),
          ),
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

  async function notifyMany<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    input: NotifyManyInput<P>,
  ): Promise<NotifyManyResult> {
    // Fail fast: invalid params would persist rows that fall back to the
    // frozen snapshot on every read.
    const params = type.paramsSchema.parse(input.params);
    const recipientIds = [...new Set(input.recipientIds)];

    // Same chain as the read path, so a row and its frozen snapshot agree.
    const event: NotificationEvent<P> = {
      params,
      actor: input.actorLabel ? { label: input.actorLabel } : undefined,
      entityType: input.entityType,
      entityId: input.entityId,
    };

    // Freeze a default-locale snapshot as the read-time recovery content.
    const frozen = renderer.renderForWrite(type, event);

    // Resolved before the transaction opens — see `resolveEffectiveChannels`.
    const effectiveChannels = await resolveEffectiveChannels(
      recipientIds,
      type,
    );

    // Stamped per row rather than onto `contentColumns`: retention is a
    // property of the durable recipient row, and `NotificationRequest` has no
    // such column — it is disposable once its deliveries settle.
    const expiresAt = new Date(Date.now() + RETENTION_MS);

    // Likewise row-only: the actor snapshot exists to survive the live user
    // row, which only the durable notification outlives.
    const actorSnapshot = { actorLabel: input.actorLabel ?? null };

    // Copied onto every row, so the request and its rows cannot disagree.
    const contentColumns = {
      type: type.key,
      templateVersion: type.version,
      params: params as Prisma.InputJsonValue,
      segments: frozen.segments,
      fallbackText: frozen.fallbackText,
      actionUrl: frozen.actionUrl,
      ...actorColumns(input),
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    };

    // The request, every recipient's row, and every delivery to make land
    // together.
    const { requestId, createdCount, inAppRecipientIds } =
      await prisma.$transaction(async (tx) => {
        // The bulk path has no per-row upsert target to dedupe against — its
        // rows are unkeyed, and their generated key is scoped to the request —
        // so replay safety still rests on resolving to the SAME request. A
        // replayed call therefore reuses the original request id, and the
        // unique on (requestId, recipientId) makes `skipDuplicates` below skip.
        const request = input.idempotencyKey
          ? await tx.notificationRequest.upsert({
              where: { idempotencyKey: input.idempotencyKey },
              update: {},
              create: {
                ...contentColumns,
                idempotencyKey: input.idempotencyKey,
              },
            })
          : await tx.notificationRequest.create({ data: contentColumns });

        // One row per recipient regardless of channel — an email-only
        // notification still gets one, with `inApp: false`, as does someone who
        // has silenced every channel. Chunked so no single statement grows with
        // the audience.
        let count = 0;
        for (const batch of chunk(recipientIds, WRITE_CHUNK_SIZE)) {
          const created = await tx.notification.createMany({
            data: batch.map((recipientId) => ({
              ...contentColumns,
              ...actorSnapshot,
              requestId: request.id,
              recipientId,
              // Unkeyed: each row is its own fact, so it collapses with nothing
              // and cannot be retracted. Scoped by request id so two fan-outs
              // of the same type never collide on it.
              key: generatedKey(request.id),
              inApp: effectiveChannels.get(recipientId)?.inApp ?? false,
              expiresAt,
            })),
            // A concurrent replay must short-circuit, not raise P2002.
            skipDuplicates: true,
          });
          count += created.count;
        }

        // Read back, not derived from the write: `createManyAndReturn` omits
        // rows it skipped, so a replay would return none of the ids needed.
        const rows: {
          id: string;
          recipientId: string;
          inApp: boolean;
          feedOrderId: string;
        }[] = [];
        for (const batch of chunk(recipientIds, WRITE_CHUNK_SIZE)) {
          rows.push(
            ...(await tx.notification.findMany({
              where: { requestId: request.id, recipientId: { in: batch } },
              select: {
                id: true,
                recipientId: true,
                inApp: true,
                feedOrderId: true,
              },
            })),
          );
        }

        // One row per (recipient, outbound channel), so one bounced address
        // fails its own row instead of a whole chunk. Keyed by recipient: a
        // channel someone has silenced produces no delivery for them.
        const deliveryData = rows.flatMap((row) =>
          (effectiveChannels.get(row.recipientId)?.outbound ?? []).map(
            (channel) => ({
              notificationId: row.id,
              requestId: request.id,
              channel,
              // The generation this delivery serves. Constant here — an
              // unkeyed row is never replaced — but carried so both write
              // paths populate the column the same way.
              feedOrderId: row.feedOrderId,
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
  async function notifyKeyed<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    input: NotifyInput<P> & { key: string },
  ): Promise<NotifyResult> {
    const params = type.paramsSchema.parse(input.params);
    const { recipientId, key } = input;

    const event: NotificationEvent<P> = {
      params,
      actor: input.actorLabel ? { label: input.actorLabel } : undefined,
      entityType: input.entityType,
      entityId: input.entityId,
    };
    const frozen = renderer.renderForWrite(type, event);

    const effectiveChannels = await resolveEffectiveChannels(
      [recipientId],
      type,
    );
    const routing = effectiveChannels.get(recipientId) ?? {
      inApp: false,
      outbound: [],
    };

    const normalizedParams = asStoredJson(params);

    const contentColumns = {
      type: type.key,
      templateVersion: type.version,
      params: normalizedParams,
      segments: frozen.segments,
      fallbackText: frozen.fallbackText,
      actionUrl: frozen.actionUrl,
      ...actorColumns(input),
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    };

    const { requestId, changed, publishTo } = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.notification.findUnique({
          where: { recipientId_key: { recipientId, key } },
          select: {
            id: true,
            params: true,
            feedOrderId: true,
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
          isEqual(existing.params, normalizedParams)
        ) {
          return { requestId: null, changed: false, publishTo: null };
        }

        const request = await tx.notificationRequest.create({
          data: contentColumns,
        });

        const expiresAt = new Date(Date.now() + RETENTION_MS);
        const actorSnapshot = { actorLabel: input.actorLabel ?? null };
        // Asked of the database, which owns the column's `uuidv7()` default:
        // generating one here would make inserts and updates disagree about
        // where the value comes from. Node has no uuidv7 of its own yet.
        const [generated] = await tx.$queryRaw<
          [{ feedOrderId: string }]
        >`SELECT uuidv7() AS "feedOrderId"`;
        const { feedOrderId } = generated;

        const row = existing
          ? await tx.notification.update({
              where: { id: existing.id },
              // Re-frozen from the new params — leaving the old snapshot would
              // make the fallback render a stale count.
              data: {
                ...contentColumns,
                ...actorSnapshot,
                requestId: request.id,
                inApp: routing.inApp,
                expiresAt,
                feedOrderId,
                // New activity, so the row is unacknowledged again. Clearing
                // `dismissedAt` is what revives a retracted row.
                seenAt: null,
                readAt: null,
                dismissedAt: null,
              },
              select: { id: true, feedOrderId: true },
            })
          : await tx.notification.create({
              data: {
                ...contentColumns,
                ...actorSnapshot,
                requestId: request.id,
                recipientId,
                key,
                inApp: routing.inApp,
                expiresAt,
                feedOrderId,
              },
              select: { id: true, feedOrderId: true },
            });

        // One per channel per generation. `skipDuplicates` because a retry that
        // lands on the same generation must not arm a second send.
        if (routing.outbound.length > 0) {
          await tx.notificationDelivery.createMany({
            data: routing.outbound.map((channel) => ({
              notificationId: row.id,
              requestId: request.id,
              channel,
              feedOrderId: row.feedOrderId,
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

  async function notify<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    input: NotifyInput<P>,
  ): Promise<NotifyResult> {
    if (input.key !== undefined) {
      // The generated-key prefix is reserved: a caller's key that carried it
      // would replace and retract like a keyed row, but the outbox would read
      // it as generated and skip the debounce.
      if (!isCallerKey(input.key)) {
        throw new BadRequestError(
          `Notification key "${input.key}" uses a reserved prefix.`,
        );
      }
      const keyed = { ...input, key: input.key };
      try {
        return await notifyKeyed(type, keyed);
      } catch (error) {
        // Two first-writes for the same key raced: both read no row, both
        // created. The loser retries, now finding the winner's row and taking
        // the update branch. Last-writer-wins is correct here — both computed
        // from the same source of truth, so either result is current.
        if (isUniqueConstraintError(error)) {
          return await notifyKeyed(type, keyed);
        }
        throw error;
      }
    }
    const { recipientId, ...rest } = input;
    return notifyMany(type, { ...rest, recipientIds: [recipientId] });
  }

  async function retract<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    input: RetractInput,
  ): Promise<RetractResult> {
    const { recipientId, key } = input;

    const { retracted, wasUnseen } = await prisma.$transaction(async (tx) => {
      const row = await tx.notification.findUnique({
        where: { recipientId_key: { recipientId, key } },
        select: { id: true, type: true, seenAt: true, dismissedAt: true },
      });

      // Nothing to withdraw. Racing retention, or a caller retracting twice —
      // both benign, so this reports rather than throws.
      if (row?.dismissedAt !== null) {
        return { retracted: false, wasUnseen: false };
      }

      // Guards against a key collision across types withdrawing the wrong row.
      if (row.type !== type.key) {
        throw new BadRequestError(
          `Notification "${key}" belongs to type "${row.type}", not "${type.key}".`,
        );
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

    // Only an unseen row was contributing to the badge.
    if (wasUnseen) await publishUnseenCounts([recipientId]);

    return { retracted };
  }

  function notifyText(
    recipientId: string,
    text: string,
    options: NotifyTextOptions = {},
  ): Promise<NotifyResult> {
    return notify(GENERIC_NOTIFICATION_TYPE, {
      recipientId,
      params: { text, actionUrl: options.actionUrl },
      actorId: options.actorId,
      actorLabel: options.actorLabel,
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
    // Read implies seen.
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
    notifyText,
    renderContent: (row, ctx, actor) => renderer.renderContent(row, ctx, actor),
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
