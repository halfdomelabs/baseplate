import { chunk } from 'es-toolkit';

import type { Prisma } from '@src/generated/prisma/client.js';

import { logError } from '@src/services/error-logger.js';
import { prisma } from '@src/services/prisma.js';

import type { NotificationChannelKey } from './notification-channel.js';
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

import { getNotificationCategory } from '../constants/notification-categories.js';
import { GENERIC_NOTIFICATION_TYPE } from './generic-type.js';

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
   * Opt-in dedupe key, stable for the triggering fact (`comment:${id}`). When
   * omitted every call is a distinct request, so two legitimately identical
   * notifications are never collapsed.
   */
  idempotencyKey?: string;
}

/** Input to notify many recipients from a single fan-out. */
export interface NotifyManyInput<P extends NotificationParams> extends Omit<
  NotifyInput<P>,
  'recipientId'
> {
  recipientIds: string[];
}

/** The dispatch a notify call created; the worker resolves it into deliveries. */
export interface NotifyResult {
  requestId: string;
}

/** Result of a fan-out. */
export interface NotifyManyResult extends NotifyResult {
  /** Rows written, across all channels. Zero on a replay. */
  createdCount: number;
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
 * The application-facing notifications capability: trigger, read, and
 * acknowledge notifications. Closes over {@link NotificationEvents} to
 * broadcast unseen-count changes and real-time updates.
 */
export interface NotificationService {
  /**
   * Trigger a notification. Takes the definition itself, so `params` are
   * checked against the renderer that will consume them.
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
   * past a few thousand recipients this wants a fan-out worker. The idempotency
   * key and `@@unique(requestId, recipientId)` already make that rerun-safe.
   */
  notifyMany<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    input: NotifyManyInput<P>,
  ): Promise<NotifyManyResult>;
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
    // the result is far smaller than the recipient list.
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

    const defaultChannels = new Set(category.defaultChannels);

    function isAllowed(recipientId: string, target: string): boolean {
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
        const request = input.idempotencyKey
          ? await tx.notificationRequest.upsert({
              where: { idempotencyKey: input.idempotencyKey },
              // A replay resolves to the existing request and writes no rows.
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
        }[] = [];
        for (const batch of chunk(recipientIds, WRITE_CHUNK_SIZE)) {
          rows.push(
            ...(await tx.notification.findMany({
              where: { requestId: request.id, recipientId: { in: batch } },
              select: { id: true, recipientId: true, inApp: true },
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

  /** Single-recipient sugar over {@link notifyMany}. */
  async function notify<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    input: NotifyInput<P>,
  ): Promise<NotifyResult> {
    const { recipientId, ...rest } = input;
    return notifyMany(type, { ...rest, recipientIds: [recipientId] });
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
    notifyText,
    renderContent: (row, ctx, actor) => renderer.renderContent(row, ctx, actor),
    getUnseenCount,
    markAsRead,
    markAllAsSeen,
    markAllAsRead,
    dismiss,
    subscribeToChanges,
  };
}
