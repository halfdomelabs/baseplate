import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { QueueService } from '@src/types/queue.types.js';

import { prisma } from '@src/services/prisma.js';

import type { NotificationChannel } from './notification-channel.js';
import type { NotificationOutbox } from './notification-outbox.js';
import type { NotificationTypeDefinition } from './notification-registry.js';

import { GENERIC_NOTIFICATION_TYPE } from './generic-type.js';
import { createNotificationOutbox } from './notification-outbox.js';
import { createNotificationRenderer } from './notification-renderer.js';
import { createNotificationService } from './notification.service.js';

/**
 * Exercises the outbox invariants against a real database: what is written in
 * the transaction, what is handed to the queue, and — the subtle ones — what
 * happens on a replay and on a sweep of a job that already ran.
 */

/**
 * An email-only variant, to prove rows are written for non-feed channels too.
 *
 * In the `security` category, which is mandatory — so these tests exercise
 * outbox behaviour without also depending on preference resolution.
 */
const EMAIL_ONLY_TYPE: NotificationTypeDefinition<{ text: string }> = {
  ...GENERIC_NOTIFICATION_TYPE,
  category: 'security',
  channels: ['email'],
};

/** Feed + email, likewise mandatory so a delivery row is always written. */
const FEED_AND_EMAIL_TYPE: NotificationTypeDefinition<{ text: string }> = {
  ...GENERIC_NOTIFICATION_TYPE,
  category: 'security',
  channels: ['inApp', 'email'],
};

/** Records every delivery the channel receives, so tests can assert on shape. */
function createRecordingChannel(): NotificationChannel & {
  deliveries: {
    recipientId: string;
    notificationId: string;
    email: string | null;
  }[];
} {
  const deliveries: {
    recipientId: string;
    notificationId: string;
    email: string | null;
  }[] = [];
  return {
    deliveries,
    deliver: ({ recipientId, notification, recipient }) => {
      deliveries.push({
        recipientId,
        notificationId: notification.id,
        email: recipient.email,
      });
      return Promise.resolve();
    },
  };
}

/**
 * A queue that records enqueued jobs; `failing` makes every enqueue throw.
 * Both entry points record, so a test cannot pass by calling neither.
 */
function createFakeQueue(options: { failing?: boolean } = {}): QueueService & {
  enqueued: { notificationIds: string[] }[];
} {
  const enqueued: { notificationIds: string[] }[] = [];
  return {
    enqueued,
    enqueue: vi.fn<QueueService['enqueue']>((_token, data) => {
      if (options.failing) return Promise.reject(new Error('enqueue failed'));
      enqueued.push(data as { notificationIds: string[] });
      return Promise.resolve('job-id');
    }),
    enqueueBulk: vi.fn<QueueService['enqueueBulk']>((_token, jobs) => {
      if (options.failing) return Promise.reject(new Error('enqueue failed'));
      enqueued.push(
        ...(jobs.map((job) => job.data) as {
          notificationIds: string[];
        }[]),
      );
      return Promise.resolve(jobs.map(() => 'job-id'));
    }),
  };
}

/** Builds both halves the way the composition root does. */
function createService(deps: {
  queue: QueueService;
  channel: NotificationChannel;
  publishUnseenCount?: (userId: string, count: number) => void;
}): ReturnType<typeof createNotificationService> & {
  outbox: NotificationOutbox;
} {
  const outbox = createNotificationOutbox({
    channels: { email: deps.channel },
    queue: deps.queue,
  });
  const service = createNotificationService({
    events: {
      publishUnseenCount: deps.publishUnseenCount ?? vi.fn(),
      subscribeToUnseenCount: vi.fn(),
    },
    renderer: createNotificationRenderer({
      notificationTypes: [GENERIC_NOTIFICATION_TYPE],
    }),
    outbox,
  });
  return { ...service, outbox };
}

/** Creates a user and returns its id. */
async function createUser(index: number): Promise<string> {
  const user = await prisma.user.create({
    data: { email: `outbox-${index}@example.com` },
  });
  return user.id;
}

/** Creates `count` users and returns their ids. */
async function createUsers(count: number): Promise<string[]> {
  const users = await prisma.user.createManyAndReturn({
    data: Array.from({ length: count }, (_, i) => ({
      email: `bulk-${i}@example.com`,
    })),
    select: { id: true },
  });
  return users.map((user) => user.id);
}

async function resetTables(): Promise<void> {
  // Deliveries cascade from the notification, but the request does not — it is
  // transient and deliberately FK-less, so it is cleared on its own.
  await prisma.notification.deleteMany();
  await prisma.notificationRequest.deleteMany();
  await prisma.user.deleteMany();
}

describe('notification outbox', () => {
  beforeEach(resetTables);
  afterAll(resetTables);

  it('writes one request and a row per recipient', async () => {
    const a = await createUser(0);
    const b = await createUser(1);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createRecordingChannel(),
    });

    const { requestId, createdCount } = await service.notifyMany(
      GENERIC_NOTIFICATION_TYPE,
      { recipientIds: [a, b], params: { text: 'hello' } },
    );

    expect(createdCount).toBe(2);
    expect(await prisma.notification.count({ where: { requestId } })).toBe(2);

    // The generic type is in-app only, so there is nothing to send.
    expect(
      await prisma.notificationDelivery.count({ where: { requestId } }),
    ).toBe(0);
    expect(queue.enqueued).toHaveLength(0);
  });

  it('writes an audience that spans several insert batches', async () => {
    // Above WRITE_CHUNK_SIZE, so the inserts, the read-back and the delivery
    // rows all run more than once. A batching bug here loses recipients
    // silently, which no smaller fan-out would catch.
    const recipientIds = await createUsers(1200);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createRecordingChannel(),
    });

    const { requestId, createdCount } = await service.notifyMany(
      EMAIL_ONLY_TYPE,
      { recipientIds, params: { text: 'hello' } },
    );

    expect(createdCount).toBe(1200);
    expect(await prisma.notification.count({ where: { requestId } })).toBe(
      1200,
    );
    // One delivery per recipient, and every one handed to the queue.
    expect(
      await prisma.notificationDelivery.count({ where: { requestId } }),
    ).toBe(1200);
    expect(queue.enqueued.flatMap((job) => job.notificationIds)).toHaveLength(
      1200,
    );
  });

  it('publishes the badge inline, without waiting for a worker', async () => {
    // The reason in-app is not a queued channel: the bell must move with the
    // mutation that triggered it, not one worker tick later.
    const a = await createUser(0);
    const publishUnseenCount = vi.fn();
    const service = createService({
      queue: createFakeQueue(),
      channel: createRecordingChannel(),
      publishUnseenCount,
    });

    await service.notify(GENERIC_NOTIFICATION_TYPE, {
      recipientId: a,
      params: { text: 'hello' },
    });

    expect(publishUnseenCount).toHaveBeenCalledWith(a, 1);
  });

  it('leaves nothing unread after marking all read, including rows outside the feed', async () => {
    // markAllNotificationsRead reports a hardcoded unreadCount of 0, which
    // holds only while markAllAsRead's scope matches getUnreadCount's filter.
    const a = await createUser(0);
    const service = createService({
      queue: createFakeQueue(),
      channel: createRecordingChannel(),
    });
    await service.notifyMany(GENERIC_NOTIFICATION_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });
    await service.notifyMany(EMAIL_ONLY_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });

    const { changedCount } = await service.markAllAsRead(a);

    expect(changedCount).toBe(1);
    expect(await service.getUnreadCount(a)).toBe(0);
  });

  it('writes a row and a delivery for an email-only type, hidden from the feed', async () => {
    const a = await createUser(0);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createRecordingChannel(),
    });

    const { requestId } = await service.notifyMany(EMAIL_ONLY_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });

    // The row exists — it is what delivery hangs off — but is not in-app, so
    // it never reaches the feed or the badge.
    const rows = await prisma.notification.findMany({ where: { requestId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.inApp).toBe(false);
    expect(await service.getUnseenCount(a)).toBe(0);

    const deliveries = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]).toMatchObject({ channel: 'email' });
    // There is no claim state: the row stays `pending` until it settles, so a
    // crash between here and the worker cannot strand it.
    expect(deliveries[0]?.status).toBe('pending');
    expect(queue.enqueued).toHaveLength(1);
  });

  it('replaying an idempotency key writes no second copy', async () => {
    const a = await createUser(0);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createRecordingChannel(),
    });
    const input = {
      recipientIds: [a],
      params: { text: 'hello' },
      idempotencyKey: 'comment:42',
    };

    const first = await service.notifyMany(GENERIC_NOTIFICATION_TYPE, input);
    const second = await service.notifyMany(GENERIC_NOTIFICATION_TYPE, input);

    // Same request, and the replay materializes nothing new — this is what the
    // unique on (requestId, recipientId) buys via `skipDuplicates`.
    expect(second.requestId).toBe(first.requestId);
    expect(second.createdCount).toBe(0);
    expect(await prisma.notification.count()).toBe(1);
    expect(await prisma.notificationRequest.count()).toBe(1);
  });

  it('a replay whose deliveries already went out re-enqueues nothing', async () => {
    const a = await createUser(0);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createRecordingChannel(),
    });
    const input = {
      recipientIds: [a],
      params: { text: 'hello' },
      idempotencyKey: 'comment:43',
    };

    const { requestId } = await service.notifyMany(EMAIL_ONLY_TYPE, input);
    await prisma.notificationDelivery.updateMany({
      where: { requestId },
      data: { status: 'delivered' },
    });
    queue.enqueued.length = 0;

    await service.notifyMany(EMAIL_ONLY_TYPE, input);

    expect(queue.enqueued).toHaveLength(0);
  });

  it('leaves the delivery pending when the enqueue fails', async () => {
    const a = await createUser(0);
    const service = createService({
      queue: createFakeQueue({ failing: true }),
      channel: createRecordingChannel(),
    });

    const { requestId } = await service.notifyMany(EMAIL_ONLY_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });

    // The notification is real; only the hand-off failed. The request stays
    // `pending`, which is the single flag the sweeper watches — and the caller
    // is not failed, since the rows are committed.
    expect(await prisma.notification.count({ where: { requestId } })).toBe(1);
    const request = await prisma.notificationRequest.findUniqueOrThrow({
      where: { id: requestId },
    });
    expect(request.fanoutStatus).toBe('pending');
    const [delivery] = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(delivery?.status).toBe('pending');
  });

  it('marks the request done once every job is handed off', async () => {
    const a = await createUser(0);
    const service = createService({
      queue: createFakeQueue(),
      channel: createRecordingChannel(),
    });

    const { requestId } = await service.notifyMany(EMAIL_ONLY_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });

    // Written last, so `done` means the work is queued, not merely started.
    const request = await prisma.notificationRequest.findUniqueOrThrow({
      where: { id: requestId },
    });
    expect(request.fanoutStatus).toBe('done');
  });

  it('the sweep re-runs a fan-out whose hand-off was interrupted', async () => {
    const a = await createUser(0);
    const service = createService({
      queue: createFakeQueue({ failing: true }),
      channel: createRecordingChannel(),
    });
    const { requestId } = await service.notifyMany(EMAIL_ONLY_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });

    // A working queue, and a threshold that treats the row as stale.
    const queue = createFakeQueue();
    const swept = await createService({
      queue,
      channel: createRecordingChannel(),
    }).outbox.sweepStaleRequests({
      staleBefore: new Date(Date.now() + 1000),
      limit: 10,
    });

    // The whole backstop: the request stayed `pending` because its jobs were
    // never enqueued, and re-running the hand-off fills that gap.
    expect(swept).toBe(1);
    expect(queue.enqueued).toHaveLength(1);
    const request = await prisma.notificationRequest.findUniqueOrThrow({
      where: { id: requestId },
    });
    expect(request.fanoutStatus).toBe('done');
  });

  it('the sweep ignores a request whose hand-off finished', async () => {
    const a = await createUser(0);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createRecordingChannel(),
    });
    const { requestId } = await service.notifyMany(EMAIL_ONLY_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });
    queue.enqueued.length = 0;

    // `notifyMany` already marked it done, so there is nothing to re-run.
    const swept = await service.outbox.sweepStaleRequests({
      staleBefore: new Date(Date.now() + 1000),
      limit: 10,
    });

    expect(swept).toBe(0);
    expect(queue.enqueued).toHaveLength(0);
    const request = await prisma.notificationRequest.findUniqueOrThrow({
      where: { id: requestId },
    });
    expect(request.fanoutStatus).toBe('done');
  });

  it('delivers each recipient their own notification with resolved contact details', async () => {
    const a = await createUser(0);
    const b = await createUser(1);
    const channel = createRecordingChannel();
    const service = createService({ queue: createFakeQueue(), channel });

    const { requestId } = await service.notifyMany(EMAIL_ONLY_TYPE, {
      recipientIds: [a, b],
      params: { text: 'hello' },
    });

    const notificationIds = (
      await prisma.notification.findMany({
        where: { requestId },
        select: { id: true },
      })
    ).map((row) => row.id);

    const result = await service.outbox.deliverChunk({
      requestId,
      channel: 'email',
      notificationIds,
    });

    expect(result.delivered).toBe(2);
    expect(channel.deliveries).toHaveLength(2);
    expect(channel.deliveries.map((d) => d.notificationId).toSorted()).toEqual(
      notificationIds.toSorted(),
    );
    // Contact details are resolved by the service, not looked up per channel.
    expect(channel.deliveries.map((d) => d.email).toSorted()).toEqual([
      'outbox-0@example.com',
      'outbox-1@example.com',
    ]);

    const deliveries = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(deliveries.every((d) => d.status === 'delivered')).toBe(true);
    expect(deliveries.every((d) => d.deliveredAt !== null)).toBe(true);
  });

  it('settles each row as it sends, so a retry cannot re-send a delivered row', async () => {
    // The failure this guards: batching the status write until after the loop
    // meant a throw on row 2 left row 1 sent-but-unmarked, and the retry sent
    // it again.
    const a = await createUser(0);
    const b = await createUser(1);
    const attempted: string[] = [];
    const channel: NotificationChannel = {
      deliver: ({ recipientId }) => {
        attempted.push(recipientId);
        if (attempted.length === 2) throw new Error('smtp rejected');
        return Promise.resolve();
      },
    };
    const service = createService({ queue: createFakeQueue(), channel });

    const { requestId } = await service.notifyMany(EMAIL_ONLY_TYPE, {
      recipientIds: [a, b],
      params: { text: 'hello' },
    });
    const notificationIds = (
      await prisma.notification.findMany({
        where: { requestId },
        select: { id: true },
      })
    ).map((row) => row.id);

    // The error is rethrown so the queue retries, but only after every row in
    // the chunk has had its turn.
    await expect(
      service.outbox.deliverChunk({
        requestId,
        channel: 'email',
        notificationIds,
      }),
    ).rejects.toThrow('smtp rejected');
    expect(attempted).toHaveLength(2);

    // The sent row is settled; the failed one is still to send, not terminal.
    const deliveries = await prisma.notificationDelivery.findMany({
      where: { requestId },
      select: { status: true, attempts: true, lastError: true },
    });
    expect(deliveries.map((d) => d.status).toSorted()).toEqual([
      'delivered',
      'pending',
    ]);
    const unsent = deliveries.find((d) => d.status === 'pending');
    expect(unsent).toMatchObject({ attempts: 1, lastError: 'smtp rejected' });

    // The retry re-sends only the row still to send — the delivered one is not
    // touched a second time.
    attempted.length = 0;
    const retry = await service.outbox.deliverChunk({
      requestId,
      channel: 'email',
      notificationIds,
    });
    expect(attempted).toHaveLength(1);
    expect(retry.delivered).toBe(1);
  });

  it('records a failure as terminal once the queue has spent its retries', async () => {
    // Exhaustion is the queue's call, not the table's: delivery always leaves
    // an erroring row pending, and the delivery queue's onFinalAttemptFailure
    // writes it off once no attempt remains.
    const a = await createUser(0);
    const channel: NotificationChannel = {
      deliver: () => {
        throw new Error('smtp rejected');
      },
    };
    const service = createService({ queue: createFakeQueue(), channel });
    const { requestId } = await service.notifyMany(EMAIL_ONLY_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });
    const notificationIds = (
      await prisma.notification.findMany({
        where: { requestId },
        select: { id: true },
      })
    ).map((row) => row.id);

    // Every attempt rethrows, so the queue keeps retrying and the row keeps
    // its breadcrumbs.
    for (const expectedAttempts of [1, 2]) {
      await expect(
        service.outbox.deliverChunk({
          requestId,
          channel: 'email',
          notificationIds,
        }),
      ).rejects.toThrow('smtp rejected');
      const [duringRetries] = await prisma.notificationDelivery.findMany({
        where: { requestId },
      });
      expect(duringRetries?.status).toBe('pending');
      expect(duringRetries?.attempts).toBe(expectedAttempts);
    }

    // What the hook does when the queue is out of retries — nothing else would
    // ever settle this row.
    const count = await service.outbox.failExhaustedDeliveries({
      requestId,
      channel: 'email',
      notificationIds,
    });

    expect(count).toBe(1);
    const [settled] = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(settled?.status).toBe('failed');
    // The per-row reason survives being written off.
    expect(settled?.lastError).toBe('smtp rejected');
    expect(settled?.attempts).toBe(2);
  });

  it('leaves already-settled rows alone when retries run out', async () => {
    // The hook fires for the whole chunk, so a row delivered on an earlier
    // attempt must not be flipped to failed by a later exhaustion.
    const a = await createUser(0);
    const b = await createUser(1);
    const attempted: string[] = [];
    const channel: NotificationChannel = {
      deliver: ({ recipientId }) => {
        attempted.push(recipientId);
        if (attempted.length === 2) throw new Error('smtp rejected');
        return Promise.resolve();
      },
    };
    const service = createService({ queue: createFakeQueue(), channel });
    const { requestId } = await service.notifyMany(EMAIL_ONLY_TYPE, {
      recipientIds: [a, b],
      params: { text: 'hello' },
    });
    const notificationIds = (
      await prisma.notification.findMany({
        where: { requestId },
        select: { id: true },
      })
    ).map((row) => row.id);

    await expect(
      service.outbox.deliverChunk({
        requestId,
        channel: 'email',
        notificationIds,
      }),
    ).rejects.toThrow('smtp rejected');

    const count = await service.outbox.failExhaustedDeliveries({
      requestId,
      channel: 'email',
      notificationIds,
    });

    // Only the row still pending is written off.
    expect(count).toBe(1);
    const deliveries = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(deliveries.map((d) => d.status).toSorted()).toEqual([
      'delivered',
      'failed',
    ]);
  });

  it('skips a delivery too old to be worth sending', async () => {
    const a = await createUser(0);
    const channel = createRecordingChannel();
    const service = createService({ queue: createFakeQueue(), channel });
    const { requestId } = await service.notifyMany(EMAIL_ONLY_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });
    const notificationIds = (
      await prisma.notification.findMany({
        where: { requestId },
        select: { id: true },
      })
    ).map((row) => row.id);

    const result = await service.outbox.deliverChunk({
      requestId,
      channel: 'email',
      notificationIds,
      expireBefore: new Date(Date.now() + 1000),
    });

    // Expired at send time, so nothing reaches the channel.
    expect(result.skipped).toBe(1);
    expect(channel.deliveries).toHaveLength(0);
    const [delivery] = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(delivery?.status).toBe('skipped');
    expect(delivery?.lastError).toBe('stale');
  });

  it('retires deliveries whose jobs never ran, keeping the ledger row', async () => {
    // Retired in place, not deleted: a deleted row is indistinguishable from
    // one that was never written.
    const a = await createUser(0);
    const service = createService({
      queue: createFakeQueue({ failing: true }),
      channel: createRecordingChannel(),
    });
    const { requestId } = await service.notifyMany(EMAIL_ONLY_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });

    const expiredCount = await service.outbox.expireStaleDeliveries({
      expireBefore: new Date(Date.now() + 1000),
    });

    expect(expiredCount).toBe(1);
    const [delivery] = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(delivery?.status).toBe('skipped');
    expect(delivery?.lastError).toBe('stale');
  });

  it('dismissing a notification does not cancel its pending delivery', async () => {
    // Channels are independent: clearing the in-app copy says nothing about
    // the email. A hard delete would cascade and silently cancel it, which is
    // why the row is soft-deleted instead.
    const a = await createUser(0);
    const service = createService({
      queue: createFakeQueue({ failing: true }),
      channel: createRecordingChannel(),
    });
    const { requestId } = await service.notifyMany(FEED_AND_EMAIL_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });
    const row = await prisma.notification.findFirstOrThrow({
      where: { requestId },
    });

    const { changed } = await service.dismiss(a, row.id);

    expect(changed).toBe(true);
    // Gone from the badge, still queued for delivery.
    expect(await service.getUnseenCount(a)).toBe(0);
    const deliveries = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.status).toBe('pending');
  });

  describe('retention', () => {
    /** Backdates a row's horizon so a retention pass considers it expired. */
    async function expire(
      notificationId: string,
      expiresAt: Date | null,
    ): Promise<void> {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { expiresAt },
      });
    }

    const PAST = new Date('2020-01-01T00:00:00Z');

    it('deletes rows past their horizon and leaves fresh ones', async () => {
      const a = await createUser(0);
      const service = createService({
        queue: createFakeQueue(),
        channel: createRecordingChannel(),
      });
      const stale = await service.notifyMany(GENERIC_NOTIFICATION_TYPE, {
        recipientIds: [a],
        params: { text: 'old' },
      });
      const fresh = await service.notifyMany(GENERIC_NOTIFICATION_TYPE, {
        recipientIds: [a],
        params: { text: 'new' },
      });
      const staleRow = await prisma.notification.findFirstOrThrow({
        where: { requestId: stale.requestId },
      });
      await expire(staleRow.id, PAST);

      const deleted = await service.outbox.deleteExpiredNotifications({
        expiredBefore: new Date(),
        batchSize: 100,
        maxDeletions: 1000,
      });

      expect(deleted).toBe(1);
      const remaining = await prisma.notification.findMany({
        select: { requestId: true },
      });
      expect(remaining.map((row) => row.requestId)).toEqual([fresh.requestId]);
    });

    it('keeps a row whose delivery has not settled', async () => {
      // The row is the delivery's parent, so collecting it would cascade and
      // cancel a send that was never made — the same invariant that makes
      // dismiss a soft delete.
      const a = await createUser(0);
      const service = createService({
        queue: createFakeQueue({ failing: true }),
        channel: createRecordingChannel(),
      });
      const { requestId } = await service.notifyMany(FEED_AND_EMAIL_TYPE, {
        recipientIds: [a],
        params: { text: 'hello' },
      });
      const row = await prisma.notification.findFirstOrThrow({
        where: { requestId },
      });
      await expire(row.id, PAST);

      const deleted = await service.outbox.deleteExpiredNotifications({
        expiredBefore: new Date(),
        batchSize: 100,
        maxDeletions: 1000,
      });

      expect(deleted).toBe(0);
      expect(await prisma.notification.count({ where: { requestId } })).toBe(1);

      // Once the delivery settles, the row becomes collectable.
      await prisma.notificationDelivery.updateMany({
        where: { requestId },
        data: { status: 'delivered' },
      });
      expect(
        await service.outbox.deleteExpiredNotifications({
          expiredBefore: new Date(),
          batchSize: 100,
          maxDeletions: 1000,
        }),
      ).toBe(1);
    });

    it('never collects a row with no horizon', async () => {
      // Rows written before retention shipped have a null `expiresAt`; they
      // must keep the old never-expire behaviour rather than being reaped on
      // the first pass after upgrade.
      const a = await createUser(0);
      const service = createService({
        queue: createFakeQueue(),
        channel: createRecordingChannel(),
      });
      const { requestId } = await service.notifyMany(
        GENERIC_NOTIFICATION_TYPE,
        { recipientIds: [a], params: { text: 'legacy' } },
      );
      const row = await prisma.notification.findFirstOrThrow({
        where: { requestId },
      });
      await expire(row.id, null);

      const deleted = await service.outbox.deleteExpiredNotifications({
        expiredBefore: new Date(),
        batchSize: 100,
        maxDeletions: 1000,
      });

      expect(deleted).toBe(0);
      expect(await prisma.notification.count({ where: { requestId } })).toBe(1);
    });

    it('collects finished requests, which nothing cascades away', async () => {
      // `requestId` is FK-less, so deleting the notifications leaves the
      // request behind — one row per `notifyMany` forever without this.
      const a = await createUser(0);
      const service = createService({
        queue: createFakeQueue(),
        channel: createRecordingChannel(),
      });
      const { requestId } = await service.notifyMany(
        GENERIC_NOTIFICATION_TYPE,
        { recipientIds: [a], params: { text: 'hello' } },
      );
      await prisma.notification.deleteMany({ where: { requestId } });

      const deleted = await service.outbox.deleteCompletedRequests({
        createdBefore: new Date(Date.now() + 1000),
        batchSize: 100,
        maxDeletions: 1000,
      });

      expect(deleted).toBe(1);
      expect(await prisma.notificationRequest.count()).toBe(0);
    });

    it('keeps a request whose delivery is still pending', async () => {
      const a = await createUser(0);
      const service = createService({
        queue: createFakeQueue({ failing: true }),
        channel: createRecordingChannel(),
      });
      const { requestId } = await service.notifyMany(FEED_AND_EMAIL_TYPE, {
        recipientIds: [a],
        params: { text: 'hello' },
      });
      // The enqueue failed, so the fan-out is still pending; settle it to
      // isolate the delivery check from the `fanoutStatus` one.
      await prisma.notificationRequest.updateMany({
        where: { id: requestId },
        data: { fanoutStatus: 'done' },
      });

      expect(
        await service.outbox.deleteCompletedRequests({
          createdBefore: new Date(Date.now() + 1000),
          batchSize: 100,
          maxDeletions: 1000,
        }),
      ).toBe(0);

      await prisma.notificationDelivery.updateMany({
        where: { requestId },
        data: { status: 'delivered' },
      });

      expect(
        await service.outbox.deleteCompletedRequests({
          createdBefore: new Date(Date.now() + 1000),
          batchSize: 100,
          maxDeletions: 1000,
        }),
      ).toBe(1);
    });

    it('stops requests at maxDeletions, not the next batch boundary', async () => {
      // The cap has to bound the `take` too: a full batch on the last
      // iteration would overshoot the documented ceiling.
      const recipientIds = await createUsers(10);
      const service = createService({
        queue: createFakeQueue(),
        channel: createRecordingChannel(),
      });
      for (const recipientId of recipientIds) {
        await service.notifyMany(GENERIC_NOTIFICATION_TYPE, {
          recipientIds: [recipientId],
          params: { text: 'hello' },
        });
      }

      const deleted = await service.outbox.deleteCompletedRequests({
        createdBefore: new Date(Date.now() + 1000),
        batchSize: 4,
        maxDeletions: 6,
      });

      expect(deleted).toBe(6);
      expect(await prisma.notificationRequest.count()).toBe(4);
    });

    it('makes progress when a whole batch is held back', async () => {
      // Held-back rows stay in the result set, so a cursorless loop would
      // re-read the same batch forever.
      const recipientIds = await createUsers(4);
      const service = createService({
        queue: createFakeQueue({ failing: true }),
        channel: createRecordingChannel(),
      });
      for (const recipientId of recipientIds) {
        await service.notifyMany(FEED_AND_EMAIL_TYPE, {
          recipientIds: [recipientId],
          params: { text: 'hello' },
        });
      }
      await prisma.notificationRequest.updateMany({
        data: { fanoutStatus: 'done' },
      });

      // Every request still has a pending delivery, so none are collectable —
      // this must terminate rather than spin.
      const deleted = await service.outbox.deleteCompletedRequests({
        createdBefore: new Date(Date.now() + 1000),
        batchSize: 2,
        maxDeletions: 1000,
      });

      expect(deleted).toBe(0);
      expect(await prisma.notificationRequest.count()).toBe(4);
    });

    it('stops at maxDeletions, leaving the rest for the next pass', async () => {
      const recipientIds = await createUsers(10);
      const service = createService({
        queue: createFakeQueue(),
        channel: createRecordingChannel(),
      });
      const { requestId } = await service.notifyMany(
        GENERIC_NOTIFICATION_TYPE,
        { recipientIds, params: { text: 'hello' } },
      );
      await prisma.notification.updateMany({
        where: { requestId },
        data: { expiresAt: PAST },
      });

      const deleted = await service.outbox.deleteExpiredNotifications({
        expiredBefore: new Date(),
        batchSize: 3,
        maxDeletions: 4,
      });

      expect(deleted).toBe(4);
      expect(await prisma.notification.count({ where: { requestId } })).toBe(6);
    });
  });
});
