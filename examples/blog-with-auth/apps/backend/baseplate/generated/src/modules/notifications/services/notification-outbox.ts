import { chunk, groupBy } from 'es-toolkit';

import type { QueueService } from '@src/types/queue.types.js';

import { logError } from '@src/services/error-logger.js';
import { prisma } from '@src/services/prisma.js';

import type {
  NotificationChannelKey,
  NotificationChannels,
  NotificationRoutingTarget,
} from './notification-channel.js';

import { notificationDeliveryQueue } from '../queues/notification-delivery.queue.js';
import { RENDER_SOURCE_SELECT } from './notification-renderer.js';

/** Rows per delivery job. */
const DELIVERY_CHUNK_SIZE = 100;

/** One chunk of one channel's fan-out, as handed to the delivery worker. */
export interface DeliverChunkInput {
  /** Carried for logging; not read for delivery. */
  requestId: string;
  channel: string;
  /** The rows this job settles. */
  notificationIds: string[];
  /**
   * True when the queue will not retry this job again. The worker settles a
   * failure as `failed` instead of rethrowing, so exhaustion is recorded
   * rather than left pending.
   */
  isFinalAttempt: boolean;
  /** Deliveries older than this are abandoned unsent — notifications perish. */
  expireBefore?: Date;
}

export interface DeliverChunkResult {
  /** Rows delivered. */
  delivered: number;
  /**
   * Rows whose channel raised an error. Left `pending` for the queue's retry,
   * or settled `failed` on the final attempt.
   */
  errored: number;
  /** Rows abandoned unsent: vanished, stale, or unroutable. */
  skipped: number;
}

/** Bounds one fan-out sweep. */
export interface SweepStaleRequestsInput {
  /**
   * Only requests created before this are re-run. Needs to exceed how long a
   * hand-off normally takes — minutes, not the retry window — so a
   * `completeFanout` still in flight is not run twice. A re-run is
   * duplicate-safe either way.
   */
  staleBefore: Date;
  /** Requests re-run per pass. */
  limit: number;
}

/** Bounds one expiry pass. */
export interface ExpireStaleDeliveriesInput {
  /** Deliveries still unsent from before this are abandoned as `skipped`. */
  expireBefore: Date;
}

/**
 * The queue-facing half of notifications. Feature code calls `notify` on the
 * service; only workers call these.
 */
export interface NotificationOutbox {
  /**
   * Narrow a type's routing targets to the channels this app installed, so a
   * target that cannot be delivered never becomes a delivery row.
   */
  installedChannels(
    targets: readonly NotificationRoutingTarget[],
  ): NotificationChannelKey[];
  /**
   * Hand a committed request's work to the queue, then mark it `done`. Called
   * by `notifyMany` after its transaction commits, and again by the sweeper if
   * that hand-off was interrupted.
   */
  completeFanout(requestId: string): Promise<number>;
  /** Deliver one chunk of one channel's fan-out. Called by the delivery worker. */
  deliverChunk(input: DeliverChunkInput): Promise<DeliverChunkResult>;
  /**
   * Re-run the hand-off for requests whose fan-out was interrupted. Called by
   * the sweep worker; covers the only gap the queue's durability cannot — a
   * crash between the transaction committing and the jobs being enqueued.
   */
  sweepStaleRequests(input: SweepStaleRequestsInput): Promise<number>;
  /**
   * Abandon deliveries too old to be worth sending, marking them `skipped`.
   *
   * Not deleted: the row records what was owed, and a give-up is a different
   * fact from never having tried. Expected to match nothing, so a non-zero
   * result means jobs were lost.
   */
  expireStaleDeliveries(input: ExpireStaleDeliveriesInput): Promise<number>;
}

/**
 * Update one delivery, only while it is still `pending`. Guards every write in
 * the worker, so a row settled by a concurrent job is never overwritten.
 */
async function updatePendingDelivery(
  notificationId: string,
  channel: string,
  data: {
    status?: 'delivered' | 'skipped' | 'failed';
    lastError?: string;
    deliveredAt?: Date;
    attempts?: { increment: number };
  },
): Promise<void> {
  await prisma.notificationDelivery.updateMany({
    where: { notificationId, channel, status: 'pending' },
    data,
  });
}

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

/** Actor presentation fields, read live so a rename is reflected. */
async function resolveActors(
  actorIds: string[],
): Promise<Map<string, { name: string | null }>> {
  if (actorIds.length === 0) return new Map();
  const users =
    await /* TPL_USER_DELEGATE:START */ prisma.user /* TPL_USER_DELEGATE:END */
      .findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true },
      });
  return new Map(users.map((user) => [user.id, { name: user.name }]));
}

async function expireStaleDeliveries(
  input: ExpireStaleDeliveriesInput,
): Promise<number> {
  const { count } = await prisma.notificationDelivery.updateMany({
    where: { status: 'pending', createdAt: { lt: input.expireBefore } },
    data: { status: 'skipped', lastError: 'stale' },
  });
  return count;
}

/** Creates the {@link NotificationOutbox}. */
export function createNotificationOutbox(deps: {
  channels: NotificationChannels;
  queue: QueueService;
}): NotificationOutbox {
  const { channels, queue } = deps;

  /** Narrows untrusted job data (`DeliverChunkInput.channel`) to an installed key. */
  function isChannelKey(channel: string): channel is NotificationChannelKey {
    return channel in channels;
  }

  function installedChannels(
    targets: readonly NotificationRoutingTarget[],
  ): NotificationChannelKey[] {
    return targets.filter((target) => isChannelKey(target));
  }

  /**
   * Hand a committed request's work to the queue, then mark it `done`.
   *
   * Runs after the transaction commits; the queue cannot join it. Throws if any
   * step fails, leaving the request `pending` for the sweeper to re-run — which
   * is safe because every write here is idempotent.
   */
  async function completeFanout(requestId: string): Promise<number> {
    const pending = await prisma.notificationDelivery.findMany({
      where: { requestId, status: 'pending' },
      select: { channel: true, notificationId: true },
      orderBy: { id: 'asc' },
    });

    const byChannel = groupBy(pending, (delivery) => delivery.channel);

    let enqueued = 0;
    for (const [channel, deliveries] of Object.entries(byChannel)) {
      const jobs = chunk(deliveries, DELIVERY_CHUNK_SIZE).map((batch) => ({
        data: {
          requestId,
          channel,
          notificationIds: batch.map((delivery) => delivery.notificationId),
        },
      }));

      // One round trip per channel, atomic across its chunks.
      await queue.enqueueBulk(notificationDeliveryQueue, jobs);
      enqueued += jobs.length;
    }

    // Last, so the flag means "everything was handed off", not "we started".
    await prisma.notificationRequest.updateMany({
      where: { id: requestId, fanoutStatus: 'pending' },
      data: { fanoutStatus: 'done' },
    });

    return enqueued;
  }

  /**
   * Delivers one chunk of one channel's fan-out; see
   * {@link NotificationOutbox.deliverChunk}.
   *
   * Rows are re-read here rather than carried in the job payload, so delivery
   * uses current params and contact details.
   */
  async function deliverChunk(
    input: DeliverChunkInput,
  ): Promise<DeliverChunkResult> {
    const { channel, notificationIds } = input;

    if (!isChannelKey(channel)) {
      // Terminal on the first attempt: retrying cannot install a channel.
      // `failed` rather than `skipped` because it is a misconfiguration worth
      // seeing, but it counts as skipped — nothing was ever attempted.
      const { count } = await prisma.notificationDelivery.updateMany({
        where: {
          notificationId: { in: notificationIds },
          channel,
          status: 'pending',
        },
        data: {
          status: 'failed',
          lastError: `No installed channel "${channel}"`,
        },
      });
      return { delivered: 0, errored: 0, skipped: count };
    }
    const channelImpl = channels[channel];

    const rows = await prisma.notification.findMany({
      where: { id: { in: notificationIds } },
      select: { ...RENDER_SOURCE_SELECT, recipientId: true },
    });

    const recipientIds = rows.map((row) => row.recipientId);
    const actorIds = [
      ...new Set(rows.map((row) => row.actorId).filter((id) => id !== null)),
    ];
    const [recipients, actors] = await Promise.all([
      resolveRecipients(recipientIds),
      resolveActors(actorIds),
    ]);

    // What stops a duplicate job re-sending: a row already settled is not
    // still to send. Read once here, so a row settled by a job running
    // concurrently with this one can still be sent twice — the accepted
    // duplicate-send edge.
    const stillToSend = new Map(
      (
        await prisma.notificationDelivery.findMany({
          where: {
            notificationId: { in: notificationIds },
            channel,
            status: 'pending',
          },
          select: { notificationId: true, createdAt: true },
        })
      ).map((delivery) => [delivery.notificationId, delivery.createdAt]),
    );

    const byId = new Map(rows.map((row) => [row.id, row]));
    let delivered = 0;
    let errored = 0;
    let skipped = 0;
    let firstError: Error | undefined;

    for (const notificationId of notificationIds) {
      const createdAt = stillToSend.get(notificationId);
      if (!createdAt) continue;

      // Perishable: a notification held up long enough is not worth sending.
      if (input.expireBefore && createdAt < input.expireBefore) {
        await updatePendingDelivery(notificationId, channel, {
          status: 'skipped',
          lastError: 'stale',
        });
        skipped += 1;
        continue;
      }

      const row = byId.get(notificationId);
      const recipient = row && recipients.get(row.recipientId);
      // The row or its recipient is gone; nothing will ever deliver it.
      if (!row || !recipient) {
        await updatePendingDelivery(notificationId, channel, {
          status: 'skipped',
          lastError: row
            ? 'recipient no longer exists'
            : 'row no longer exists',
        });
        skipped += 1;
        continue;
      }

      try {
        await channelImpl.deliver({
          recipientId: row.recipientId,
          notification: row,
          recipient,
          actor: row.actorId ? (actors.get(row.actorId) ?? null) : null,
        });
        // Settled before the next row, so a later throw cannot re-send this
        // one. If this write itself fails the row stays pending and may send
        // twice.
        await updatePendingDelivery(notificationId, channel, {
          status: 'delivered',
          deliveredAt: new Date(),
        });
        delivered += 1;
      } catch (error) {
        logError(error, {
          source: 'notification-delivery',
          requestId: input.requestId,
          channel,
          notificationId,
        });
        const lastError =
          error instanceof Error ? error.message : String(error);
        // On the queue's last attempt nothing will retry this, so record the
        // outcome; otherwise leave it pending and let the queue come back.
        await updatePendingDelivery(notificationId, channel, {
          ...(input.isFinalAttempt ? { status: 'failed' as const } : {}),
          attempts: { increment: 1 },
          lastError,
        });
        errored += 1;
        firstError ??=
          error instanceof Error ? error : new Error(String(error));
      }
    }

    // Thrown after the loop, so one bad row cannot strand the rest of the
    // chunk. On the final attempt the rows are already settled, so the job
    // succeeds rather than landing in the DLQ.
    if (firstError && !input.isFinalAttempt) throw firstError;

    return { delivered, errored, skipped };
  }

  async function sweepStaleRequests(
    input: SweepStaleRequestsInput,
  ): Promise<number> {
    const stale = await prisma.notificationRequest.findMany({
      where: { fanoutStatus: 'pending', createdAt: { lt: input.staleBefore } },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: input.limit,
    });

    let sweptCount = 0;
    for (const { id } of stale) {
      try {
        // Idempotent: unique keys and `skipDuplicates` mean a re-run fills the
        // gaps, and re-enqueued jobs for finished chunks settle nothing.
        await completeFanout(id);
        sweptCount += 1;
      } catch (error) {
        // Stays `pending` for the next pass.
        logError(error, { source: 'notification-fanout-sweep', requestId: id });
      }
    }

    return sweptCount;
  }

  return {
    installedChannels,
    completeFanout,
    deliverChunk,
    sweepStaleRequests,
    expireStaleDeliveries,
  };
}
