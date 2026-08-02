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

/** An email-only variant, to prove rows are written for non-feed channels too. */
const EMAIL_ONLY_TYPE: NotificationTypeDefinition<{ text: string }> = {
  ...GENERIC_NOTIFICATION_TYPE,
  channels: ['email'],
};

/** Records every delivery the channel receives, so tests can assert on shape. */
function createRecordingChannel(): NotificationChannel & {
  deliveries: { recipientId: string; count: number; email: string | null }[];
} {
  const deliveries: {
    recipientId: string;
    count: number;
    email: string | null;
  }[] = [];
  return {
    deliveries,
    deliver: ({ recipientId, notifications, recipient }) => {
      deliveries.push({
        recipientId,
        count: notifications.length,
        email: recipient.email,
      });
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

  it('delivers each recipient their notifications as one batched call', async () => {
    // The digest seam: the channel's unit of work is (recipient, events[]), so
    // a digest can collapse N events into one delivery without reopening this
    // layer. Today N is 1, and this locks the shape that keeps it extensible.
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
      isFinalAttempt: false,
    });

    expect(result.delivered).toBe(2);
    // One call per recipient, each carrying that recipient's rows as an array.
    expect(channel.deliveries).toHaveLength(2);
    expect(channel.deliveries.every((d) => d.count === 1)).toBe(true);
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
        isFinalAttempt: false,
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
      isFinalAttempt: false,
    });
    expect(attempted).toHaveLength(1);
    expect(retry.delivered).toBe(1);
  });

  it('records a failure as terminal on the queue’s final attempt', async () => {
    // Exhaustion is the queue's call, not the table's: while retries remain
    // the row stays pending, and only the last attempt writes it off.
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

    await expect(
      service.outbox.deliverChunk({
        requestId,
        channel: 'email',
        notificationIds,
        isFinalAttempt: false,
      }),
    ).rejects.toThrow('smtp rejected');
    const [duringRetries] = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(duringRetries?.status).toBe('pending');

    // The queue is out of retries, so the outcome is recorded rather than
    // rethrown — nothing else would ever settle this row.
    const result = await service.outbox.deliverChunk({
      requestId,
      channel: 'email',
      notificationIds,
      isFinalAttempt: true,
    });

    expect(result.errored).toBe(1);
    const [settled] = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(settled?.status).toBe('failed');
    expect(settled?.lastError).toBe('smtp rejected');
    expect(settled?.attempts).toBe(2);
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
      isFinalAttempt: false,
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
    const { requestId } = await service.notifyMany(
      { ...GENERIC_NOTIFICATION_TYPE, channels: ['inApp', 'email'] },
      { recipientIds: [a], params: { text: 'hello' } },
    );
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
});
