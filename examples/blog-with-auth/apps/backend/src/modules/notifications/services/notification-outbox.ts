import { chunk, groupBy, partition } from 'es-toolkit';

import type { Prisma } from '@src/generated/prisma/client.js';
import type { QueueService } from '@src/types/queue.types.js';

import { logError } from '@src/services/error-logger.js';
import { prisma } from '@src/services/prisma.js';

import type {
  NotificationChannelKey,
  NotificationChannels,
  NotificationRoutingTarget,
} from '../channels/types.js';
import type {
  NotificationChannelSetting,
  NotificationMode,
} from '../constants/notification-topics.js';
import type {
  NotificationRenderer,
  RenderSource,
} from './notification-renderer.js';

import {
  getNotificationTopic,
  resolveChannelSetting,
} from '../constants/notification-topics.js';
import { notificationDeliveryQueue } from '../queues/notification-delivery.queue.js';
import { isGeneratedKey } from '../registry.js';
import { RENDER_SOURCE_SELECT } from './notification-renderer.js';

/** Rows per delivery job. */
const DELIVERY_CHUNK_SIZE = 100;

/**
 * How long a keyed notification's outbound send waits before it is eligible.
 *
 * A keyed row is replaced in place, so the delay lets a burst of activity
 * settle into one email instead of one per event: the job renders whatever the
 * row says when it finally runs. Applied only to keyed rows — an unkeyed
 * notification is a single fact and goes out immediately.
 */
const KEYED_DELIVERY_DELAY_SECONDS = 5 * 60;

/**
 * Rows one digest message may carry. A recipient past this gets the oldest
 * rows now and the rest on the next pass, rather than one unbounded email.
 */
const DIGEST_MAX_ROWS_PER_PAIR = 200;

/** One chunk of one channel's fan-out, as handed to the delivery worker. */
export interface DeliverChunkInput {
  /** Carried for logging; not read for delivery. */
  requestId: string;
  channel: string;
  /** The rows this job settles. */
  notificationIds: string[];
  /** Deliveries older than this are abandoned unsent — notifications perish. */
  expireBefore?: Date;
}

export interface DeliverChunkResult {
  /** Rows delivered. */
  delivered: number;
  /**
   * Rows whose channel raised an error. Left `pending` for the queue's retry;
   * settled `failed` by the delivery queue's exhaustion hook once retries run
   * out.
   */
  errored: number;
  /** Rows abandoned unsent: vanished, stale, or unroutable. */
  skipped: number;
}

/**
 * The chunk whose retries the delivery queue has spent. Structurally the job
 * payload, so the hook can pass it straight through.
 */
export interface FailExhaustedDeliveriesInput {
  /** Unused here; part of the job payload this is passed as. */
  requestId: string;
  channel: string;
  /** The rows to settle, the same set the exhausted job was delivering. */
  notificationIds: string[];
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

/** Bounds one digest pass. */
export interface SendDueDigestsInput {
  /** Pairs with a digest row due before this are sent. Normally now. */
  dueBefore: Date;
  /**
   * (recipient, channel) pairs sent per pass. A larger backlog drains over
   * several runs rather than holding one worker for an unbounded stretch.
   */
  maxPairs: number;
}

/** What one digest pass did. */
export interface SendDueDigestsResult {
  /** Pairs that sent a message. */
  sentCount: number;
  /** Rows settled `delivered` across those pairs. */
  deliveredCount: number;
  /** Rows settled `skipped` because the channel was silenced mid-window. */
  skippedCount: number;
  /** Pairs whose send threw. Their rows stay pending for the next pass. */
  erroredCount: number;
}

/** Bounds one retention pass. */
export interface DeleteExpiredNotificationsInput {
  /** Rows whose `expiresAt` is before this are eligible for deletion. */
  expiredBefore: Date;
  /** Rows per statement. */
  batchSize: number;
  /** Ceiling on one pass, so a large backlog is drained over several runs. */
  maxDeletions: number;
}

/** Bounds one request-cleanup pass. */
export interface DeleteCompletedRequestsInput {
  /** Requests created before this are eligible, once their work is done. */
  createdBefore: Date;
  /** Rows per statement. */
  batchSize: number;
  /** Ceiling on one pass. */
  maxDeletions: number;
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
   * Send every digest whose window has closed, one message per
   * (recipient, channel). Called by the digest worker on a schedule.
   *
   * A pair is due when its *oldest* pending row is due; the send then drains
   * every pending digest row for that pair, so newer rows ride along rather
   * than waiting for a window of their own. That is what keeps a busy recipient
   * on one email per window instead of one per window per notification.
   *
   * Preferences are re-read here, not trusted from routing time: an unsubscribe
   * between the write and the send takes effect, settling those rows `skipped`.
   */
  sendDueDigests(input: SendDueDigestsInput): Promise<SendDueDigestsResult>;
  /**
   * Settle a chunk's still-`pending` rows as `failed`, once the delivery queue
   * has spent its retries on them. Called by the delivery queue's
   * `onFinalAttemptFailure`, so exhaustion is recorded rather than left for
   * the sweeper to expire — which would fire an alarm meant for lost jobs.
   *
   * Per-row `lastError` breadcrumbs written during delivery are preserved.
   */
  failExhaustedDeliveries(input: FailExhaustedDeliveriesInput): Promise<number>;
  /**
   * Re-run the hand-off for requests whose fan-out was interrupted. Called by
   * the sweep worker; covers the only gap the queue's durability cannot — a
   * crash between the transaction committing and the jobs being enqueued.
   */
  sweepStaleRequests(input: SweepStaleRequestsInput): Promise<number>;
  /**
   * Abandon deliveries too old to be worth sending, marking them `skipped`.
   *
   * Not deleted: the row records that the send was due, and a give-up is a
   * different fact from never having tried. Expected to match nothing, so a
   * non-zero result means jobs were lost.
   */
  expireStaleDeliveries(input: ExpireStaleDeliveriesInput): Promise<number>;
  /**
   * Hard-delete notifications past their retention horizon, in bounded batches.
   *
   * Only rows whose deliveries have all settled are removed: a row is the
   * parent of its deliveries, so dropping one with a delivery still `pending`
   * would cancel a send that was never made. A row held back this way is
   * retried next pass.
   */
  deleteExpiredNotifications(
    input: DeleteExpiredNotificationsInput,
  ): Promise<number>;
  /**
   * Drop finished requests, in bounded batches.
   *
   * The request is transient dispatch state and is deliberately FK-less, so
   * nothing cascades it away when its notifications are collected — without
   * this it would accumulate one row per `notifyMany` forever.
   */
  deleteCompletedRequests(input: DeleteCompletedRequestsInput): Promise<number>;
}

/**
 * Update a notification's deliveries, only while they are still `pending`.
 * Guards every write in the worker, so a row settled by a concurrent job is
 * never overwritten.
 *
 * Addressed by delivery id, not (notification, channel): a keyed row is
 * replaced in place, so the pair would also match generations armed after this
 * job's read, which it has not sent.
 */
async function updatePendingDeliveries(
  deliveryIds: string[],
  data: {
    status?: 'delivered' | 'skipped' | 'failed';
    lastError?: string;
    deliveredAt?: Date;
    attempts?: { increment: number };
  },
): Promise<void> {
  await prisma.notificationDelivery.updateMany({
    where: { id: { in: deliveryIds }, status: 'pending' },
    data,
  });
}

/**
 * When each row was last delivered on this channel — the delta boundary.
 * Absent from the map means never delivered.
 *
 * Only `delivered` rows count. An abandoned delivery is `skipped` and never
 * sets `deliveredAt`, so an outage widens the next delta rather than losing it.
 */
async function resolveDeltaAnchors(
  notificationIds: string[],
  channel: string,
): Promise<Map<string, Date>> {
  const groups = await prisma.notificationDelivery.groupBy({
    by: ['notificationId'],
    where: {
      notificationId: { in: notificationIds },
      channel,
      status: 'delivered',
    },
    _max: { deliveredAt: true },
  });

  const anchors = new Map<string, Date>();
  for (const group of groups) {
    const deliveredAt = group._max.deliveredAt;
    if (deliveredAt) anchors.set(group.notificationId, deliveredAt);
  }
  return anchors;
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

/**
 * Settles a chunk's leftover rows as `failed`; see
 * {@link NotificationOutbox.failExhaustedDeliveries}.
 */
async function failExhaustedDeliveries(
  input: FailExhaustedDeliveriesInput,
): Promise<number> {
  const { channel, notificationIds } = input;

  // Only rows still pending: anything delivered or skipped during the failed
  // attempt is already settled, and this must not undo it. `lastError` is left
  // as delivery wrote it, so the per-row reason survives.
  const { count } = await prisma.notificationDelivery.updateMany({
    where: {
      notificationId: { in: notificationIds },
      channel,
      status: 'pending',
    },
    data: { status: 'failed' },
  });

  return count;
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

async function deleteExpiredNotifications(
  input: DeleteExpiredNotificationsInput,
): Promise<number> {
  const { expiredBefore, batchSize, maxDeletions } = input;

  let deleted = 0;
  while (deleted < maxDeletions) {
    // Ids first, then delete by primary key: an unbounded `deleteMany` over
    // the horizon would lock a range that grows with the backlog, and the
    // first run on an existing project is the largest one.
    const rows = await prisma.notification.findMany({
      where: {
        expiresAt: { not: null, lt: expiredBefore },
        deliveries: { none: { status: 'pending' } },
      },
      select: { id: true },
      take: Math.min(batchSize, maxDeletions - deleted),
    });
    if (rows.length === 0) break;

    const { count } = await prisma.notification.deleteMany({
      where: { id: { in: rows.map((row) => row.id) } },
    });
    deleted += count;

    // A short pass means the horizon is drained; anything newly expiring can
    // wait for the next run.
    if (rows.length < batchSize) break;
  }

  return deleted;
}

async function deleteCompletedRequests(
  input: DeleteCompletedRequestsInput,
): Promise<number> {
  const { createdBefore, batchSize, maxDeletions } = input;

  let deleted = 0;
  let examined = 0;
  // Paged by id rather than by re-reading from the start: a row held back for
  // an unsettled delivery stays in the result set, so without a cursor a batch
  // of held-back rows would be read forever.
  let cursor: string | undefined;
  while (deleted < maxDeletions && examined < maxDeletions) {
    const rows = await prisma.notificationRequest.findMany({
      where: {
        createdAt: { lt: createdBefore },
        fanoutStatus: 'done',
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: Math.min(batchSize, maxDeletions - deleted),
    });
    if (rows.length === 0) break;
    examined += rows.length;
    cursor = rows.at(-1)?.id;

    // `requestId` is FK-less, so there is no relation to filter on and nothing
    // would stop a request going while a delivery still needs it — the worker
    // reads the request to deliver. Checked as a separate query instead.
    const withPendingDeliveries = new Set(
      (
        await prisma.notificationDelivery.findMany({
          where: {
            requestId: { in: rows.map((row) => row.id) },
            status: 'pending',
          },
          select: { requestId: true },
          distinct: ['requestId'],
        })
      ).map((delivery) => delivery.requestId),
    );

    const collectable = rows
      .map((row) => row.id)
      .filter((id) => !withPendingDeliveries.has(id));

    if (collectable.length > 0) {
      const { count } = await prisma.notificationRequest.deleteMany({
        where: { id: { in: collectable } },
      });
      deleted += count;
    }

    // Counted on rows examined, not rows deleted: a batch entirely held back
    // would otherwise re-read the same ids forever.
    if (rows.length < batchSize) break;
  }

  return deleted;
}

/** Creates the {@link NotificationOutbox}. */
export function createNotificationOutbox(deps: {
  channels: NotificationChannels;
  queue: QueueService;
  renderer: NotificationRenderer;
}): NotificationOutbox {
  const { channels, queue, renderer } = deps;

  /**
   * The row as this send should render it: a batched type re-resolves its
   * params against `since`, so an outbound message can phrase a delta while the
   * stored row goes on holding state.
   *
   * Substitutes params rather than rendered content, leaving one render path —
   * the channel renders as it always does, and the frozen-snapshot fallback
   * still applies. Nothing is written back.
   *
   * Falls back to the row untouched when the delta cannot be computed: the
   * underlying fact is gone or the params no longer satisfy `inputSchema`.
   * Neither improves on retry, and the stored state is still worth sending.
   */
  async function resolveForDelivery(
    row: RenderSource,
    since: Date | null,
  ): Promise<RenderSource> {
    const type = renderer.getType(row.type, row.templateVersion);
    if (type?.kind !== 'batched') return row;

    try {
      // The row stores params, not the input that produced them; `inputSchema`
      // strips the params back down to the input's own fields.
      const input: unknown = type.inputSchema.parse(row.params ?? {});
      const params = await type.resolveParams(input, { since });
      return { ...row, params: params as Prisma.JsonValue };
    } catch (error) {
      logError(error, {
        source: 'notification-delta',
        notificationId: row.id,
        type: `${row.type}@${row.templateVersion}`,
      });
      return row;
    }
  }

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
      // Digest rows are deliberately excluded: they carry a `digestDueAt` and
      // are claimed by the digest scan, which collapses a whole window across
      // requests. Enqueuing them here would send one message per notification,
      // which is the thing a digest exists to prevent.
      where: { requestId, status: 'pending', mode: { not: 'digest' } },
      select: {
        channel: true,
        notificationId: true,
        // Collapsing rows debounce; non-collapsing ones go out immediately.
        // Read from the row rather than passed in, so the sweeper's re-run
        // makes the same choice as the original hand-off.
        notification: { select: { groupKey: true } },
      },
      orderBy: { id: 'asc' },
    });

    // The delay belongs to the job, so one job cannot hold both kinds.
    const [debounced, immediate] = partition(
      pending,
      (delivery) => !isGeneratedKey(delivery.notification.groupKey),
    );

    let enqueued = 0;
    for (const [rows, delaySeconds] of [
      [immediate, undefined],
      [debounced, KEYED_DELIVERY_DELAY_SECONDS],
    ] as const) {
      for (const [channel, deliveries] of Object.entries(
        groupBy(rows, (delivery) => delivery.channel),
      )) {
        const jobs = chunk(deliveries, DELIVERY_CHUNK_SIZE).map((batch) => ({
          data: {
            requestId,
            channel,
            notificationIds: batch.map((delivery) => delivery.notificationId),
          },
          ...(delaySeconds === undefined ? {} : { options: { delaySeconds } }),
        }));

        // One round trip per channel, atomic across its chunks.
        await queue.enqueueBulk(notificationDeliveryQueue, jobs);
        enqueued += jobs.length;
      }
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
    const recipients = await resolveRecipients(recipientIds);

    const anchors = await resolveDeltaAnchors(notificationIds, channel);

    // What stops a duplicate job re-sending: a row already settled is not
    // still to send. Read once here, so a row settled by a job running
    // concurrently with this one can still be sent twice — the accepted
    // duplicate-send edge.
    //
    // All pending generations for a notification, not just one: content is
    // re-read live above, so a single send satisfies every generation this job
    // saw, and settling them together stops a burst sending the same email
    // twice. A generation armed after this read stays pending for its own job.
    const stillToSend = new Map<
      string,
      { ids: string[]; oldestCreatedAt: Date }
    >();
    for (const delivery of await prisma.notificationDelivery.findMany({
      where: {
        notificationId: { in: notificationIds },
        channel,
        status: 'pending',
      },
      select: { id: true, notificationId: true, createdAt: true },
      orderBy: { id: 'asc' },
    })) {
      const entry = stillToSend.get(delivery.notificationId);
      if (entry) {
        entry.ids.push(delivery.id);
      } else {
        stillToSend.set(delivery.notificationId, {
          ids: [delivery.id],
          oldestCreatedAt: delivery.createdAt,
        });
      }
    }

    const byId = new Map(rows.map((row) => [row.id, row]));
    let delivered = 0;
    let errored = 0;
    let skipped = 0;
    let firstError: Error | undefined;

    for (const notificationId of notificationIds) {
      const delivery = stillToSend.get(notificationId);
      if (!delivery) continue;

      // Perishable: a notification held up long enough is not worth sending.
      // Judged on the oldest pending generation, so a row that kept being
      // replaced past the horizon still expires.
      if (input.expireBefore && delivery.oldestCreatedAt < input.expireBefore) {
        await updatePendingDeliveries(delivery.ids, {
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
        await updatePendingDeliveries(delivery.ids, {
          status: 'skipped',
          lastError: row
            ? 'recipient no longer exists'
            : 'row no longer exists',
        });
        skipped += 1;
        continue;
      }

      try {
        const notification = await resolveForDelivery(
          row,
          anchors.get(notificationId) ?? null,
        );
        await channelImpl.deliver({
          recipientId: row.recipientId,
          notification,
          recipient,
        });
        // Settled before the next row, so a later throw cannot re-send this
        // one. If this write itself fails the row stays pending and may send
        // twice.
        // Every generation read at the start of this job, not just the one it
        // was armed for: the content delivered was read live, so it is current
        // for all of them and a second send would be a duplicate.
        await updatePendingDeliveries(delivery.ids, {
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
        // Left pending with breadcrumbs so the queue can come back to it.
        // Settling an exhausted row is the delivery queue's
        // `onFinalAttemptFailure`, not this loop's job.
        await updatePendingDeliveries(delivery.ids, {
          attempts: { increment: 1 },
          lastError,
        });
        errored += 1;
        firstError ??=
          error instanceof Error ? error : new Error(String(error));
      }
    }

    // Thrown after the loop, so one bad row cannot strand the rest of the
    // chunk. Always thrown: the queue needs the failure to retry, and to know
    // when to run the exhaustion hook.
    if (firstError) throw firstError;

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
        logError(error, { source: 'notification-fanout-sweep', requestId: id });
      }
    }

    return sweptCount;
  }

  /**
   * Whether this recipient still wants this channel for this row's topic.
   *
   * Re-read at send time rather than trusted from the row: a preference change
   * between the write and the window closing is exactly what a digest gives
   * someone time to make.
   *
   * A row whose type is topic-less, or whose renderer is gone, consults no
   * preference and is sent — matching `resolveRouting`, where a topic-less type
   * is unsuppressible by construction.
   */
  function isStillWanted(
    row: RenderSource,
    channel: NotificationChannelKey,
    overrides: Map<string, NotificationChannelSetting>,
  ): boolean {
    const topicKey = renderer.getTopic(row.type, row.templateVersion);
    if (topicKey === null) return true;
    const setting = resolveChannelSetting(
      getNotificationTopic(topicKey),
      channel,
      overrides.get(topicKey),
    );
    // `immediate` still sends: the row was routed to the digest and nothing
    // re-enqueues it into the immediate lane, so excluding it would strand it
    // until the stale sweeper expired it unsent.
    return setting.mode !== 'off';
  }

  /**
   * Send one pair's digest; see {@link NotificationOutbox.sendDueDigests}.
   * Returns what it settled, or null when there was nothing left to send.
   */
  async function sendDigestForPair(
    recipientId: string,
    channel: NotificationChannelKey,
  ): Promise<{ delivered: number; skipped: number } | null> {
    const channelImpl = channels[channel];

    // Every pending row for the pair, not only the due ones: the window has
    // closed for this recipient, so newer rows ride along rather than waiting
    // for a window of their own.
    //
    // Read without locking, so a row settled by a concurrent pass can still be
    // sent twice — the same accepted duplicate-send edge `deliverChunk` takes.
    const deliveries = await prisma.notificationDelivery.findMany({
      where: { recipientId, channel, status: 'pending', mode: 'digest' },
      select: { id: true, notificationId: true },
      orderBy: { id: 'asc' },
      take: DIGEST_MAX_ROWS_PER_PAIR,
    });
    if (deliveries.length === 0) return null;

    const [recipients, rows, overrideRows] = await Promise.all([
      resolveRecipients([recipientId]),
      prisma.notification.findMany({
        where: { id: { in: deliveries.map((d) => d.notificationId) } },
        select: { ...RENDER_SOURCE_SELECT, recipientId: true },
      }),
      prisma.notificationPreference.findMany({
        where: { userId: recipientId, channel },
        select: { topicKey: true, mode: true, digestWindowSeconds: true },
      }),
    ]);

    const recipient = recipients.get(recipientId);
    const byId = new Map(rows.map((row) => [row.id, row]));
    const overrides = new Map<string, NotificationChannelSetting>(
      overrideRows.map((row) => [
        row.topicKey,
        {
          mode: row.mode as NotificationMode,
          digestWindowSeconds: row.digestWindowSeconds ?? undefined,
        },
      ]),
    );

    // The recipient vanished between the write and the window closing; nothing
    // will ever deliver these.
    if (!recipient) {
      await updatePendingDeliveries(
        deliveries.map((d) => d.id),
        { status: 'skipped', lastError: 'recipient no longer exists' },
      );
      return { delivered: 0, skipped: deliveries.length };
    }

    const sendable: { deliveryId: string; row: RenderSource }[] = [];
    const unsendable: { deliveryId: string; reason: string }[] = [];
    for (const delivery of deliveries) {
      const row = byId.get(delivery.notificationId);
      if (!row) {
        unsendable.push({
          deliveryId: delivery.id,
          reason: 'row no longer exists',
        });
      } else if (isStillWanted(row, channel, overrides)) {
        sendable.push({ deliveryId: delivery.id, row });
      } else {
        unsendable.push({ deliveryId: delivery.id, reason: 'unsubscribed' });
      }
    }

    // Settled before the send, so a throw below cannot resurrect them: these
    // are not failures to retry, they are rows that must never go out.
    for (const [reason, group] of Object.entries(
      groupBy(unsendable, (entry) => entry.reason),
    )) {
      await updatePendingDeliveries(
        group.map((entry) => entry.deliveryId),
        { status: 'skipped', lastError: reason },
      );
    }

    if (sendable.length === 0) {
      return { delivered: 0, skipped: unsendable.length };
    }

    const anchors = await resolveDeltaAnchors(
      sendable.map((entry) => entry.row.id),
      channel,
    );
    const notifications = await Promise.all(
      sendable.map((entry) =>
        resolveForDelivery(entry.row, anchors.get(entry.row.id) ?? null),
      ),
    );

    if (channelImpl.deliverDigest) {
      await channelImpl.deliverDigest({
        recipientId,
        notifications,
        recipient,
      });
    } else {
      // The channel cannot batch. The window still collapsed — this is one
      // send per row rather than one per event — but there is no single
      // message to fold them into.
      for (const notification of notifications) {
        await channelImpl.deliver({ recipientId, notification, recipient });
      }
    }

    // After the send, so a throw leaves every row pending for the next pass.
    // A duplicate message is possible if the channel accepted before throwing,
    // which is the at-least-once guarantee the immediate path also gives.
    await updatePendingDeliveries(
      sendable.map((entry) => entry.deliveryId),
      { status: 'delivered', deliveredAt: new Date() },
    );

    return { delivered: sendable.length, skipped: unsendable.length };
  }

  async function sendDueDigests(
    input: SendDueDigestsInput,
  ): Promise<SendDueDigestsResult> {
    const duePairs = await prisma.notificationDelivery.findMany({
      where: {
        status: 'pending',
        mode: 'digest',
        digestDueAt: { lte: input.dueBefore },
      },
      select: { recipientId: true, channel: true },
      distinct: ['recipientId', 'channel'],
      // Oldest first, so a backlog drains in the order it accumulated rather
      // than starving whoever has been waiting longest.
      orderBy: { digestDueAt: 'asc' },
      take: input.maxPairs,
    });

    const result: SendDueDigestsResult = {
      sentCount: 0,
      deliveredCount: 0,
      skippedCount: 0,
      erroredCount: 0,
    };

    for (const pair of duePairs) {
      const { recipientId, channel } = pair;
      // A channel uninstalled since the row was written. Terminal — retrying
      // cannot install one — and worth seeing, so it settles `failed`.
      if (!isChannelKey(channel)) {
        const { count } = await prisma.notificationDelivery.updateMany({
          where: { recipientId, channel, status: 'pending', mode: 'digest' },
          data: {
            status: 'failed',
            lastError: `No installed channel "${channel}"`,
          },
        });
        result.skippedCount += count;
        continue;
      }

      try {
        const sent = await sendDigestForPair(recipientId, channel);
        if (sent) {
          if (sent.delivered > 0) result.sentCount += 1;
          result.deliveredCount += sent.delivered;
          result.skippedCount += sent.skipped;
        }
      } catch (error) {
        // Per pair, so one bad address cannot strand everyone else's digest.
        // The rows stay pending and the next pass retries them, together with
        // whatever arrived meanwhile.
        logError(error, {
          source: 'notification-digest',
          recipientId,
          channel,
        });
        result.erroredCount += 1;
      }
    }

    return result;
  }

  return {
    installedChannels,
    completeFanout,
    deliverChunk,
    sendDueDigests,
    failExhaustedDeliveries,
    sweepStaleRequests,
    expireStaleDeliveries,
    deleteExpiredNotifications,
    deleteCompletedRequests,
  };
}
