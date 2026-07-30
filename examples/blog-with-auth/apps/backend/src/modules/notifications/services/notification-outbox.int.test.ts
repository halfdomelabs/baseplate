import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { QueueService } from '@src/types/queue.types.js';

import { prisma } from '@src/services/prisma.js';

import type { NotificationChannel } from './notification-channel.js';

import { GENERIC_NOTIFICATION_TYPE } from './generic-type.js';
import { createNotificationRenderer } from './notification-renderer.js';
import { createNotificationService } from './notification.service.js';

/**
 * Exercises the outbox invariants against a real database: what is written in
 * the transaction, what is handed to the queue, and — the subtle ones — what
 * happens on a replay and on a sweep of a job that already ran.
 */

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

/** A queue that records enqueues; `failing` makes every enqueue throw. */
function createFakeQueue(options: { failing?: boolean } = {}): QueueService & {
  enqueued: { singletonKey?: string }[];
} {
  const enqueued: { singletonKey?: string }[] = [];
  return {
    enqueued,
    enqueue: vi.fn<QueueService['enqueue']>((_token, _data, opts) => {
      if (options.failing) return Promise.reject(new Error('enqueue failed'));
      enqueued.push({ singletonKey: opts?.singletonKey });
      return Promise.resolve('job-id');
    }),
    enqueueBulk: vi.fn<QueueService['enqueueBulk']>(() => Promise.resolve([])),
  };
}

function createService(deps: {
  queue: QueueService;
  channel: NotificationChannel;
}): ReturnType<typeof createNotificationService> {
  return createNotificationService({
    events: { publishUnseenCount: vi.fn(), subscribeToUnseenCount: vi.fn() },
    renderer: createNotificationRenderer({
      notificationTypes: [GENERIC_NOTIFICATION_TYPE],
    }),
    channels: { inApp: deps.channel, email: deps.channel },
    queue: deps.queue,
  });
}

/** Creates a user and returns its id. */
async function createUser(index: number): Promise<string> {
  const user = await prisma.user.create({
    data: { email: `outbox-${index}@example.com` },
  });
  return user.id;
}

async function resetTables(): Promise<void> {
  // Feed items no longer cascade from the request (the request is transient),
  // so each table is cleared explicitly.
  await prisma.notificationFeedItem.deleteMany();
  await prisma.notificationDelivery.deleteMany();
  await prisma.notificationRequest.deleteMany();
  await prisma.user.deleteMany();
}

describe('notification outbox', () => {
  beforeEach(resetTables);
  afterAll(resetTables);

  it('writes one request, the inbox rows, and a delivery row per chunk', async () => {
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
    expect(
      await prisma.notificationFeedItem.count({ where: { requestId } }),
    ).toBe(2);

    // One chunk (2 recipients is well under the chunk size), one channel.
    const deliveries = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]).toMatchObject({ channel: 'inApp', chunkIndex: 0 });
    // Flipped to `enqueued` only after the queue accepted it.
    expect(deliveries[0]?.status).toBe('enqueued');
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
    expect(await prisma.notificationFeedItem.count()).toBe(1);
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

    const { requestId } = await service.notifyMany(
      GENERIC_NOTIFICATION_TYPE,
      input,
    );
    await prisma.notificationDelivery.updateMany({
      where: { requestId },
      data: { status: 'delivered' },
    });
    queue.enqueued.length = 0;

    await service.notifyMany(GENERIC_NOTIFICATION_TYPE, input);

    expect(queue.enqueued).toHaveLength(0);
  });

  it('leaves the delivery pending when the enqueue fails', async () => {
    const a = await createUser(0);
    const service = createService({
      queue: createFakeQueue({ failing: true }),
      channel: createRecordingChannel(),
    });

    const { requestId } = await service.notifyMany(GENERIC_NOTIFICATION_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });

    // The notification is real; only its delivery is owed. Recording that is
    // the whole point — a crash here used to lose the delivery silently.
    expect(
      await prisma.notificationFeedItem.count({ where: { requestId } }),
    ).toBe(1);
    const [delivery] = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(delivery?.status).toBe('pending');
    expect(delivery?.lastError).toContain('enqueue failed');
  });

  it('the sweep re-drives a stale pending delivery', async () => {
    const a = await createUser(0);
    const service = createService({
      queue: createFakeQueue({ failing: true }),
      channel: createRecordingChannel(),
    });
    const { requestId } = await service.notifyMany(GENERIC_NOTIFICATION_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });

    // A working queue, and a threshold that treats the row as stale.
    const queue = createFakeQueue();
    const swept = await createService({
      queue,
      channel: createRecordingChannel(),
    }).sweepStaleDeliveries({
      staleBefore: new Date(Date.now() + 1000),
      limit: 10,
    });

    expect(swept).toBe(1);
    expect(queue.enqueued).toHaveLength(1);
    const [delivery] = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(delivery?.status).toBe('enqueued');
  });

  it('the sweep does NOT re-deliver a job that already completed', async () => {
    const a = await createUser(0);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createRecordingChannel(),
    });
    const { requestId } = await service.notifyMany(GENERIC_NOTIFICATION_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });
    await prisma.notificationDelivery.updateMany({
      where: { requestId },
      data: { status: 'delivered' },
    });
    queue.enqueued.length = 0;

    // A completed job has released its singletonKey, so dedupe would NOT stop
    // a second send — the status check is the only thing that does.
    const swept = await service.sweepStaleDeliveries({
      staleBefore: new Date(Date.now() + 1000),
      limit: 10,
    });

    expect(swept).toBe(0);
    expect(queue.enqueued).toHaveLength(0);
  });

  it('delivers each recipient their notifications as one batched call', async () => {
    // The digest seam: the channel's unit of work is (recipient, events[]), so
    // ENG-1222 can collapse N events into one delivery without reopening this
    // layer. Today N is 1, and this locks the shape that keeps it extensible.
    const a = await createUser(0);
    const b = await createUser(1);
    const channel = createRecordingChannel();
    const service = createService({ queue: createFakeQueue(), channel });

    const { requestId } = await service.notifyMany(GENERIC_NOTIFICATION_TYPE, {
      recipientIds: [a, b],
      params: { text: 'hello' },
    });

    const result = await service.deliverChunk({
      requestId,
      channel: 'inApp',
      chunkIndex: 0,
      recipientIds: [a, b],
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

    const [delivery] = await prisma.notificationDelivery.findMany({
      where: { requestId },
    });
    expect(delivery?.status).toBe('delivered');
  });

  it('delivers without any feed items, so a non-in-app channel stands alone', async () => {
    // The point of the split: delivery renders from the REQUEST, so deleting
    // every feed item (as an email-only app would never create) changes
    // nothing. Before, this path read its render source from those rows.
    const a = await createUser(0);
    const channel = createRecordingChannel();
    const service = createService({ queue: createFakeQueue(), channel });

    const { requestId } = await service.notifyMany(GENERIC_NOTIFICATION_TYPE, {
      recipientIds: [a],
      params: { text: 'hello' },
    });
    await prisma.notificationFeedItem.deleteMany();

    const result = await service.deliverChunk({
      requestId,
      channel: 'email',
      chunkIndex: 0,
      recipientIds: [a],
    });

    expect(result.delivered).toBe(1);
    expect(channel.deliveries).toHaveLength(1);
    expect(channel.deliveries[0]?.email).toBe('outbox-0@example.com');
  });
});
