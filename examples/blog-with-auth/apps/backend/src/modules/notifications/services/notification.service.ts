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
  NotificationEvent,
  NotificationTypeDefinition,
} from './notification-registry.js';
import type {
  NotificationRenderer,
  RenderSource,
} from './notification-renderer.js';

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

/** Actor columns from the input (human actors; live name/avatar via the relation). */
function actorColumns(actorId: string | undefined): {
  actorKind: string;
  actorId: string | null;
} {
  return actorId
    ? { actorKind: 'user', actorId }
    : { actorKind: 'none', actorId: null };
}

/** Input to trigger a notification. The type is the definition, not a key. */
export interface NotifyInput<P extends NotificationParams> {
  recipientId: string;
  params: P;
  actorId?: string;
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
  renderContent(row: RenderSource, ctx?: RenderContext): RenderedContent;
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

    const event: NotificationEvent<P> = {
      params,
      actorId: input.actorId,
      entityType: input.entityType,
      entityId: input.entityId,
    };

    // Freeze a default-locale snapshot as the read-time recovery content.
    const frozen = renderer.renderForWrite(type, event);
    const routing = resolveRouting(type);

    // Stamped per row rather than onto `contentColumns`: retention is a
    // property of the durable recipient row, and `NotificationRequest` has no
    // such column — it is disposable once its deliveries settle.
    const expiresAt = new Date(Date.now() + RETENTION_MS);

    // Copied onto every row, so the request and its rows cannot disagree.
    const contentColumns = {
      type: type.key,
      templateVersion: type.version,
      params: params as Prisma.InputJsonValue,
      segments: frozen.segments,
      fallbackText: frozen.fallbackText,
      actionUrl: frozen.actionUrl,
      ...actorColumns(input.actorId),
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
        // notification still gets one, with `inApp: false`. Chunked so no
        // single statement grows with the audience.
        let count = 0;
        for (const batch of chunk(recipientIds, WRITE_CHUNK_SIZE)) {
          const created = await tx.notification.createMany({
            data: batch.map((recipientId) => ({
              ...contentColumns,
              requestId: request.id,
              recipientId,
              inApp: routing.inApp,
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
        // fails its own row instead of a whole chunk.
        const deliveryData = rows.flatMap((row) =>
          routing.outbound.map((channel) => ({
            notificationId: row.id,
            requestId: request.id,
            channel,
          })),
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
    renderContent: (row, ctx) => renderer.renderContent(row, ctx),
    getUnseenCount,
    markAsRead,
    markAllAsSeen,
    markAllAsRead,
    dismiss,
    subscribeToChanges,
  };
}
