import type { Prisma } from '@src/generated/prisma/client.js';
import type { QueueService } from '@src/types/queue.types.js';

import { logError } from '@src/services/error-logger.js';
import { prisma } from '@src/services/prisma.js';

import type {
  NotificationChannelKey,
  NotificationChannels,
} from './notification-channel.js';
import type {
  NotificationParams,
  RenderContext,
  RenderedContent,
} from './notification-content.js';
import type { NotificationEvents } from './notification-events.js';
import type {
  NotificationEvent,
  NotificationTypeDefinition,
} from './notification-registry.js';
import type {
  NotificationRenderer,
  RenderSource,
} from './notification-renderer.js';

import { notificationDeliveryQueue } from '../queues/notification-delivery.queue.js';
import { GENERIC_NOTIFICATION_TYPE } from './generic-type.js';

/** Recipients per delivery job, so a large fan-out is many bounded jobs. */
const DELIVERY_CHUNK_SIZE = 100;

/**
 * Render inputs held on the dispatch request, including the frozen snapshot —
 * so delivery has the same retired-renderer fallback the feed has.
 */
const REQUEST_RENDER_SOURCE_SELECT = {
  type: true,
  templateVersion: true,
  params: true,
  segments: true,
  fallbackText: true,
  actionUrl: true,
  actorId: true,
  entityType: true,
  entityId: true,
} satisfies Prisma.NotificationRequestSelect;

/** Contact details for a chunk's recipients, keyed by id. */
async function resolveRecipients(
  recipientIds: string[],
): Promise<Map<string, { email: string | null }>> {
  const users =
    await /* TPL_USER_DELEGATE:START */ prisma.user /* TPL_USER_DELEGATE:END */
      .findMany({
        where: { id: { in: recipientIds } },
        select: { id: true, email: true },
      });
  return new Map(users.map((user) => [user.id, { email: user.email }]));
}

/** The actor's presentation fields, read live so a rename is reflected. */
async function resolveActor(
  actorId: string,
): Promise<{ name: string | null } | null> {
  return /* TPL_USER_DELEGATE:START */ prisma.user /* TPL_USER_DELEGATE:END */
    .findUnique({
      where: { id: actorId },
      select: { name: true },
    });
}

/**
 * Unseen counts for a whole chunk in one query. Zero-count groups are omitted,
 * so a recipient with nothing unseen is absent and reads as 0.
 */
async function countUnseenFor(
  recipientIds: string[],
): Promise<Map<string, number>> {
  const groups = await prisma.notificationFeedItem.groupBy({
    by: ['recipientId'],
    where: { recipientId: { in: recipientIds }, seenAt: null },
    _count: { _all: true },
  });
  return new Map(groups.map((group) => [group.recipientId, group._count._all]));
}

/** Splits recipients into the slices each delivery job covers. */
function chunkRecipients(recipientIds: string[]): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < recipientIds.length; i += DELIVERY_CHUNK_SIZE) {
    chunks.push(recipientIds.slice(i, i + DELIVERY_CHUNK_SIZE));
  }
  return chunks;
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
  /** Feed rows written. Zero on a replay, or when in-app is not installed. */
  createdCount: number;
}

/** One chunk of one channel's fan-out, as handed to the delivery worker. */
export interface DeliverChunkInput {
  requestId: string;
  channel: string;
  /** Which slice of the fan-out — identifies the delivery row to settle. */
  chunkIndex: number;
  recipientIds: string[];
}

export interface DeliverChunkResult {
  /** Recipients delivered to. */
  delivered: number;
  /** Recipients in the chunk with no matching row (deleted since enqueue). */
  skipped: number;
}

/** Bounds one outbox sweep. */
export interface SweepStaleDeliveriesInput {
  /**
   * Only deliveries created before this are considered. Must be older than the
   * delivery queue's retry window, so a job that is merely retrying is not
   * mistaken for one that was lost.
   */
  staleBefore: Date;
  /** Deliveries re-driven per run. */
  limit: number;
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
   * Returns the dispatch handle, not a row: what the caller triggered is a
   * notification, and which rows that produces depends on the installed
   * channels (with in-app off there is no feed row at all).
   */
  notify<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    input: NotifyInput<P>,
  ): Promise<NotifyResult>;
  /**
   * Trigger one notification for many recipients: a single outbox request plus
   * the inbox rows, with delivery handed to the queue in chunks, so caller
   * latency is flat regardless of audience size.
   */
  notifyMany<P extends NotificationParams>(
    type: NotificationTypeDefinition<P>,
    input: NotifyManyInput<P>,
  ): Promise<NotifyManyResult>;
  /** Deliver one chunk of one channel's fan-out. Called by the delivery worker. */
  deliverChunk(input: DeliverChunkInput): Promise<DeliverChunkResult>;
  /** Re-drive deliveries stuck `pending`. Called by the sweep worker. */
  sweepStaleDeliveries(input: SweepStaleDeliveriesInput): Promise<number>;
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
  /** Delete a notification. `changed` is false if it didn't exist. */
  delete(userId: string, notificationId: string): Promise<UnseenCountResult>;
  /** Subscribe to real-time unseen-count changes for a user. */
  subscribeToChanges(userId: string): AsyncIterable<{ count: number }>;
}

async function getUnseenCount(userId: string): Promise<number> {
  return prisma.notificationFeedItem.count({
    where: { recipientId: userId, seenAt: null },
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
  channels: NotificationChannels;
  queue: QueueService;
}): NotificationService {
  const { events, renderer, channels, queue } = deps;

  /** Narrows untrusted job data (`DeliverChunkInput.channel`) to an installed key. */
  function isChannelKey(channel: string): channel is NotificationChannelKey {
    return channel in channels;
  }

  /**
   * The type's channels narrowed to those installed. The preference seam:
   * per-user opt-outs slot in here (default-allow today), so client input can
   * never widen the set.
   */
  function resolveEffectiveChannels(
    _recipientId: string,
    type: NotificationTypeDefinition,
  ): NotificationChannelKey[] {
    return type.channels.filter(isChannelKey);
  }

  /** Recompute, broadcast the change, and return the unseen count for a user. */
  async function publishUnseenCount(userId: string): Promise<number> {
    const count = await getUnseenCount(userId);
    events.publishUnseenCount(userId, count);
    return count;
  }

  /**
   * Hand every `pending` delivery of a request to the queue and mark it
   * `enqueued`.
   *
   * Runs after the transaction commits, since the queue cannot join it. A
   * failed enqueue leaves the row `pending` for the sweeper rather than
   * rolling back a notification that was really written.
   */
  async function enqueuePendingDeliveries(requestId: string): Promise<number> {
    const pending = await prisma.notificationDelivery.findMany({
      where: { requestId, status: 'pending' },
      select: {
        id: true,
        channel: true,
        chunkIndex: true,
        recipientIds: true,
      },
    });

    let enqueued = 0;
    for (const delivery of pending) {
      // Claim atomically: only one concurrent sweep sees a row change.
      const { count } = await prisma.notificationDelivery.updateMany({
        where: { id: delivery.id, status: 'pending' },
        data: { status: 'enqueued' },
      });
      if (count === 0) continue;

      try {
        await queue.enqueue(
          notificationDeliveryQueue,
          {
            requestId,
            channel: delivery.channel,
            chunkIndex: delivery.chunkIndex,
            recipientIds: delivery.recipientIds as string[],
          },
          {
            // Drops a duplicate enqueue while the job is pending or active.
            singletonKey: `${requestId}:${delivery.channel}:${delivery.chunkIndex}`,
          },
        );
        enqueued += 1;
      } catch (error) {
        // Release the claim so the sweeper retries it.
        logError(error, {
          source: 'notification-delivery-enqueue',
          channel: delivery.channel,
          requestId,
        });
        await prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'pending',
            attempts: { increment: 1 },
            lastError: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    return enqueued;
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
    const effectiveChannels = recipientIds.flatMap((recipientId) =>
      resolveEffectiveChannels(recipientId, type),
    );
    const channelKeys = [...new Set(effectiveChannels)];

    const requestData = {
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

    // The request, its inbox rows, and what delivery is owed land together.
    const { requestId, createdCount } = await prisma.$transaction(
      async (tx) => {
        const request = input.idempotencyKey
          ? await tx.notificationRequest.upsert({
              where: { idempotencyKey: input.idempotencyKey },
              // A replay resolves to the existing request and writes no rows.
              update: {},
              create: { ...requestData, idempotencyKey: input.idempotencyKey },
            })
          : await tx.notificationRequest.create({ data: requestData });

        // Only when in-app is an effective channel: with it off, there is
        // nothing to show in the feed.
        const { count } = channelKeys.includes('inApp')
          ? await tx.notificationFeedItem.createMany({
              data: recipientIds.map((recipientId) => ({
                requestId: request.id,
                type: type.key,
                templateVersion: type.version,
                recipientId,
                params: params as Prisma.InputJsonValue,
                segments: frozen.segments,
                fallbackText: frozen.fallbackText,
                actionUrl: frozen.actionUrl,
                ...actorColumns(input.actorId),
                entityType: input.entityType ?? null,
                entityId: input.entityId ?? null,
              })),
              // A concurrent replay must short-circuit, not raise P2002.
              skipDuplicates: true,
            })
          : { count: 0 };

        // One row per (channel, chunk) so each job settles independently.
        await tx.notificationDelivery.createMany({
          data: channelKeys.flatMap((channel) =>
            chunkRecipients(recipientIds).map((chunk, chunkIndex) => ({
              requestId: request.id,
              channel,
              chunkIndex,
              recipientIds: chunk,
            })),
          ),
          skipDuplicates: true,
        });

        return { requestId: request.id, createdCount: count };
      },
    );

    await enqueuePendingDeliveries(requestId);

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

  /**
   * Delivers one chunk of one channel's fan-out; see
   * {@link NotificationService.deliverChunk}.
   *
   * Rows are re-read here rather than carried in the job payload: `createMany`
   * returns no ids, and re-reading also picks up the CURRENT params and
   * contact details, which is what lets a copy fix reach an email that has not
   * gone out yet.
   */
  async function deliverChunk(
    input: DeliverChunkInput,
  ): Promise<DeliverChunkResult> {
    const { requestId, channel, chunkIndex, recipientIds } = input;

    if (!isChannelKey(channel)) {
      // Permanent, not transient: retrying cannot install a channel.
      await prisma.notificationDelivery.updateMany({
        where: { requestId, channel, chunkIndex },
        data: {
          status: 'failed',
          lastError: `No installed channel "${channel}"`,
        },
      });
      return { delivered: 0, skipped: recipientIds.length };
    }
    const channelImpl = channels[channel];

    // Rendered from the REQUEST, not the feed rows: feed rows belong to the
    // in-app channel alone, and every channel needs a render source.
    const request = await prisma.notificationRequest.findUnique({
      where: { id: requestId },
      select: REQUEST_RENDER_SOURCE_SELECT,
    });
    if (!request) {
      await prisma.notificationDelivery.updateMany({
        where: { requestId, channel, chunkIndex },
        data: { status: 'failed', lastError: 'Request no longer exists' },
      });
      return { delivered: 0, skipped: recipientIds.length };
    }

    const [recipients, actor] = await Promise.all([
      resolveRecipients(recipientIds),
      request.actorId ? resolveActor(request.actorId) : Promise.resolve(null),
    ]);

    const source: RenderSource = { ...request, id: requestId };
    const unseenCounts = await countUnseenFor(recipientIds);

    let delivered = 0;
    for (const recipientId of recipientIds) {
      const recipient = recipients.get(recipientId);
      if (!recipient) continue;
      await channelImpl.deliver({
        recipientId,
        notifications: [source],
        unseenCount: unseenCounts.get(recipientId) ?? 0,
        recipient,
        actor,
      });
      delivered += 1;
    }

    // Load-bearing: stops the sweeper re-enqueuing a chunk that already went
    // out. Scoped to this chunk so siblings aren't marked delivered too.
    await prisma.notificationDelivery.updateMany({
      where: { requestId, channel, chunkIndex },
      data: { status: 'delivered' },
    });

    return { delivered, skipped: recipientIds.length - delivered };
  }

  async function sweepStaleDeliveries(
    input: SweepStaleDeliveriesInput,
  ): Promise<number> {
    const stale = await prisma.notificationDelivery.findMany({
      where: { status: 'pending', createdAt: { lt: input.staleBefore } },
      select: { requestId: true },
      distinct: ['requestId'],
      take: input.limit,
    });

    // The claim in `enqueuePendingDeliveries` skips anything no longer
    // `pending` — a completed job has released its key, so dedupe alone would
    // let a second copy through.
    let sweptCount = 0;
    for (const { requestId } of stale) {
      sweptCount += await enqueuePendingDeliveries(requestId);
    }

    return sweptCount;
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

  async function markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<UnseenCountResult> {
    const now = new Date();
    const { count } = await prisma.notificationFeedItem.updateMany({
      where: { id: notificationId, recipientId: userId, readAt: null },
      data: { readAt: now },
    });
    // Read implies seen: clear an unseen row's badge state in the same stroke.
    await prisma.notificationFeedItem.updateMany({
      where: { id: notificationId, recipientId: userId, seenAt: null },
      data: { seenAt: now },
    });
    return {
      changed: count > 0,
      unseenCount: await publishUnseenCount(userId),
    };
  }

  async function markAllAsSeen(
    userId: string,
  ): Promise<MarkNotificationsResult> {
    const { count } = await prisma.notificationFeedItem.updateMany({
      where: { recipientId: userId, seenAt: null },
      data: { seenAt: new Date() },
    });
    return {
      changedCount: count,
      unseenCount:
        count > 0
          ? await publishUnseenCount(userId)
          : await getUnseenCount(userId),
    };
  }

  async function markAllAsRead(
    userId: string,
  ): Promise<MarkNotificationsResult> {
    const now = new Date();
    const { count } = await prisma.notificationFeedItem.updateMany({
      where: { recipientId: userId, readAt: null },
      data: { readAt: now },
    });
    // Read implies seen.
    await prisma.notificationFeedItem.updateMany({
      where: { recipientId: userId, seenAt: null },
      data: { seenAt: now },
    });
    return {
      changedCount: count,
      unseenCount: await publishUnseenCount(userId),
    };
  }

  async function deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<UnseenCountResult> {
    const { count } = await prisma.notificationFeedItem.deleteMany({
      where: { id: notificationId, recipientId: userId },
    });
    return {
      changed: count > 0,
      unseenCount:
        count > 0
          ? await publishUnseenCount(userId)
          : await getUnseenCount(userId),
    };
  }

  function subscribeToChanges(userId: string): AsyncIterable<{
    count: number;
  }> {
    return events.subscribeToUnseenCount(userId);
  }

  return {
    notify,
    notifyMany,
    deliverChunk,
    sweepStaleDeliveries,
    notifyText,
    renderContent: (row, ctx) => renderer.renderContent(row, ctx),
    getUnseenCount,
    markAsRead,
    markAllAsSeen,
    markAllAsRead,
    delete: deleteNotification,
    subscribeToChanges,
  };
}
