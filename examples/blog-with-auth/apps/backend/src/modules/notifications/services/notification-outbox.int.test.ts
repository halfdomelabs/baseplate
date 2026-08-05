import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { Prisma } from '@src/generated/prisma/client.js';
import type { QueueService } from '@src/types/queue.types.js';

import { prisma } from '@src/services/prisma.js';

import type { NotificationChannel } from '../channels/types.js';
import type { AnyNotificationType } from '../registry.js';
import type { NotificationOutbox } from './notification-outbox.js';

import {
  defineBatchedNotificationType,
  defineNotificationType,
} from '../registry.js';
import { GENERIC_NOTIFICATION_TYPE } from './generic-type.js';
import { frozenNotificationContentSchema } from './notification-content.js';
import { createNotificationOutbox } from './notification-outbox.js';
import { createNotificationRenderer } from './notification-renderer.js';
import { createNotificationService } from './notification.service.js';

/** Read the stored snapshot's title, which the DB hands back as raw JSON. */
function frozenText(frozenContent: unknown): string {
  return frozenNotificationContentSchema.parse(frozenContent).title;
}

/**
 * Exercises the outbox invariants against a real database: what is written in
 * the transaction, what is handed to the queue, and — the subtle ones — what
 * happens on a replay and on a sweep of a job that already ran.
 */

/**
 * An email-only variant, to prove rows are written for non-feed channels too.
 *
 * It belongs to no topic, so these tests exercise outbox behaviour without also
 * depending on preference resolution — a type in no topic reads no preference row.
 */
const EMAIL_ONLY_TYPE = defineNotificationType({
  ...GENERIC_NOTIFICATION_TYPE,
  topic: undefined,
  channels: ['email'],
});

/** Feed + email, likewise topic-less so a delivery row is always written. */
const FEED_AND_EMAIL_TYPE = defineNotificationType({
  ...GENERIC_NOTIFICATION_TYPE,
  topic: undefined,
  channels: ['inApp', 'email'],
});

/**
 * A collapsing variant: derives a group key from `text`, so repeated notifies
 * about the same text replace one row rather than adding more.
 */
const COLLAPSING_TYPE = defineNotificationType({
  ...GENERIC_NOTIFICATION_TYPE,
  topic: undefined,
  groupKey: ({ text }) => `test:${text}`,
});

/**
 * Params for the like-thread fixtures below: `postId` is what the key is
 * derived from, so evolving `text` replaces one row rather than adding more —
 * the state-phrased contract a collapsing type places on its params.
 */
const likeThreadParamsSchema = z.object({
  postId: z.string(),
  text: z.string(),
});

/** A collapsing like-thread, feed + email. */
const LIKE_THREAD_TYPE = defineNotificationType({
  key: 'test.likeThread',
  version: 1,
  paramsSchema: likeThreadParamsSchema,
  groupKey: ({ postId }) => `post:${postId}:likes`,
  channels: ['inApp', 'email'],
  render: (params) => ({ title: params.text }),
});

/** The same, email-only, for the outbound debounce. */
const LIKE_THREAD_EMAIL_TYPE = defineNotificationType({
  key: 'test.likeThreadEmail',
  version: 1,
  paramsSchema: likeThreadParamsSchema,
  groupKey: ({ postId }) => `post:${postId}:likes`,
  channels: ['email'],
  render: (params) => ({ title: params.text }),
});

/** One delivery as the channel saw it. */
interface RecordedDelivery {
  recipientId: string;
  notificationId: string;
  email: string | null;
  /** The params this send rendered from, which may differ from the row's. */
  params: Prisma.JsonValue;
}

/** Records every delivery the channel receives, so tests can assert on shape. */
function createRecordingChannel(): NotificationChannel & {
  deliveries: RecordedDelivery[];
} {
  const deliveries: RecordedDelivery[] = [];
  return {
    deliveries,
    deliver: ({ recipientId, notification, recipient }) => {
      deliveries.push({
        recipientId,
        notificationId: notification.id,
        email: recipient.email,
        params: notification.params,
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
  /** Extra types this test needs registered, beyond the shared fixtures. */
  notificationTypes?: AnyNotificationType[];
}): ReturnType<typeof createNotificationService> & {
  outbox: NotificationOutbox;
} {
  // One renderer for both halves, as the composition root does.
  const renderer = createNotificationRenderer({
    notificationTypes: [
      GENERIC_NOTIFICATION_TYPE,
      LIKE_THREAD_TYPE,
      LIKE_THREAD_EMAIL_TYPE,
      ...(deps.notificationTypes ?? []),
    ],
  });
  const outbox = createNotificationOutbox({
    channels: { email: deps.channel },
    queue: deps.queue,
    renderer,
  });
  const service = createNotificationService({
    events: {
      publishUnseenCount: deps.publishUnseenCount ?? vi.fn(),
      subscribeToUnseenCount: vi.fn(),
    },
    renderer,
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

/** The same, plus preference rows — the digest tests are the only ones to write them. */
async function resetDigestTables(): Promise<void> {
  await prisma.notificationPreference.deleteMany();
  await resetTables();
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

  it('replaying the same key writes no second copy', async () => {
    const a = await createUser(0);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createRecordingChannel(),
    });
    const input = { recipientId: a, params: { text: 'hello' } };

    await service.notify(COLLAPSING_TYPE, input);
    await service.notify(COLLAPSING_TYPE, input);

    // Identical state, so the second call is a no-op: the unique on
    // (type, groupKey, recipientId) means there is one row, and the deep-equal
    // check means it was not even rewritten.
    expect(await prisma.notification.count()).toBe(1);
  });

  it('a replay whose delivery already went out enqueues nothing new', async () => {
    const a = await createUser(0);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createRecordingChannel(),
    });
    // Both calls use the same type: `type` is part of the unique key now, so
    // notifying a different type would be a different row rather than a replay.
    const input = { recipientId: a, params: { postId: '7', text: 'hello' } };

    const { requestId } = await service.notify(LIKE_THREAD_EMAIL_TYPE, input);
    // A first write always dispatches; only a no-op replay returns null.
    expect(requestId).not.toBeNull();
    await prisma.notificationDelivery.updateMany({
      where: { requestId: requestId ?? undefined },
      data: { status: 'delivered' },
    });
    queue.enqueued.length = 0;

    await service.notify(LIKE_THREAD_EMAIL_TYPE, input);

    // The replay changed nothing, so no new generation and no re-arm.
    expect(queue.enqueued).toHaveLength(0);
  });

  it('a real change replaces the row in place and re-arms delivery', async () => {
    const a = await createUser(0);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createRecordingChannel(),
    });
    const postId = '7';

    const first = await service.notify(LIKE_THREAD_EMAIL_TYPE, {
      recipientId: a,
      params: { postId, text: 'Alice liked your post' },
    });
    expect(first.requestId).not.toBeNull();
    await prisma.notificationDelivery.updateMany({
      where: { requestId: first.requestId ?? undefined },
      data: { status: 'delivered' },
    });
    const before = await prisma.notification.findFirstOrThrow({
      where: { recipientId: a, groupKey: `post:${postId}:likes` },
      select: { id: true, feedSortKey: true },
    });
    queue.enqueued.length = 0;

    await service.notify(LIKE_THREAD_EMAIL_TYPE, {
      recipientId: a,
      params: { postId, text: 'Alice and 2 others liked your post' },
    });

    const after = await prisma.notification.findFirstOrThrow({
      where: { recipientId: a, groupKey: `post:${postId}:likes` },
      select: { id: true, feedSortKey: true, frozenContent: true },
    });

    // Still one row, same identity — deliveries cascade off `id`, so it must
    // survive. Only the sort key is reissued, which is what resurfaces it.
    expect(await prisma.notification.count()).toBe(1);
    expect(after.id).toBe(before.id);
    expect(after.feedSortKey).not.toBe(before.feedSortKey);
    expect(frozenText(after.frozenContent)).toBe(
      'Alice and 2 others liked your post',
    );

    // The settled delivery belonged to the previous generation, so the new one
    // is free to arm without colliding.
    expect(queue.enqueued).toHaveLength(1);
  });

  it('retracting settles pending deliveries and hides the row', async () => {
    const a = await createUser(0);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createRecordingChannel(),
    });
    const postId = '8';

    await service.notify(LIKE_THREAD_EMAIL_TYPE, {
      recipientId: a,
      params: { postId, text: 'Alice liked your post' },
    });

    const result = await service.retract(LIKE_THREAD_EMAIL_TYPE, {
      recipientId: a,
      params: { postId, text: '' },
    });

    const row = await prisma.notification.findFirstOrThrow({
      where: { recipientId: a, groupKey: `post:${postId}:likes` },
      select: { dismissedAt: true },
    });
    const deliveries = await prisma.notificationDelivery.findMany({
      select: { status: true, lastError: true },
    });

    expect(result.retracted).toBe(true);
    // Soft-deleted rather than removed, so the row keeps its deliveries and
    // every read path already filters it out.
    expect(row.dismissedAt).not.toBeNull();
    expect(deliveries[0]?.status).toBe('skipped');
    expect(deliveries[0]?.lastError).toBe('retracted');
  });

  it('settles every generation it read, so one burst sends one email', async () => {
    const a = await createUser(0);
    const channel = createRecordingChannel();
    const service = createService({ queue: createFakeQueue(), channel });
    const postId = '11';

    // A burst: two likes inside the debounce window, so the row is replaced
    // and both generations are armed and pending when the job finally runs.
    const first = await service.notify(LIKE_THREAD_EMAIL_TYPE, {
      recipientId: a,
      params: { postId, text: 'Alice liked your post' },
    });
    await service.notify(LIKE_THREAD_EMAIL_TYPE, {
      recipientId: a,
      params: { postId, text: 'Alice and Bob liked your post' },
    });

    const row = await prisma.notification.findFirstOrThrow({
      where: { recipientId: a, groupKey: `post:${postId}:likes` },
      select: { id: true },
    });
    await service.outbox.deliverChunk({
      requestId: first.requestId ?? '',
      channel: 'email',
      notificationIds: [row.id],
    });

    const deliveries = await prisma.notificationDelivery.findMany({
      where: { notificationId: row.id },
      select: { status: true },
    });

    // Content is read live, so the one send already carries the latest state
    // and satisfies both generations. Leaving the second pending would mail
    // the same thing again when its own job fires — the duplicate the
    // debounce exists to prevent.
    expect(channel.deliveries).toHaveLength(1);
    expect(deliveries).toHaveLength(2);
    expect(
      deliveries.every((delivery) => delivery.status === 'delivered'),
    ).toBe(true);
  });

  it('reports nothing to retract when the row is already gone', async () => {
    const a = await createUser(0);
    const service = createService({
      queue: createFakeQueue(),
      channel: createRecordingChannel(),
    });

    const result = await service.retract(LIKE_THREAD_TYPE, {
      recipientId: a,
      params: { postId: 'never-written', text: '' },
    });

    expect(result.retracted).toBe(false);
  });

  it('re-notifying after a retraction revives the row', async () => {
    const a = await createUser(0);
    const service = createService({
      queue: createFakeQueue(),
      channel: createRecordingChannel(),
    });
    const postId = '9';

    await service.notify(LIKE_THREAD_TYPE, {
      recipientId: a,
      params: { postId, text: 'Alice liked your post' },
    });
    await service.retract(LIKE_THREAD_TYPE, {
      recipientId: a,
      params: { postId, text: '' },
    });
    await service.notify(LIKE_THREAD_TYPE, {
      recipientId: a,
      params: { postId, text: 'Bob liked your post' },
    });

    const row = await prisma.notification.findFirstOrThrow({
      where: { recipientId: a, groupKey: `post:${postId}:likes` },
      select: { dismissedAt: true, frozenContent: true },
    });

    // Retraction and re-notification are the two directions of one upsert, so
    // a later like clears the soft delete rather than stacking a second row.
    expect(await prisma.notification.count()).toBe(1);
    expect(row.dismissedAt).toBeNull();
    expect(frozenText(row.frozenContent)).toBe('Bob liked your post');
  });

  it('replaying a bulk fan-out of a collapsing type writes no second copy', async () => {
    const recipientIds = await createUsers(2);
    const service = createService({
      queue: createFakeQueue(),
      channel: createRecordingChannel(),
    });
    const input = { recipientIds, params: { text: 'hello' } };

    const first = await service.notifyMany(COLLAPSING_TYPE, input);
    const second = await service.notifyMany(COLLAPSING_TYPE, input);

    // Dedupe moved from a caller-supplied idempotency key to the type's own
    // group key: the replay writes a second request — it is only a dispatch
    // record — but `@@unique(type, groupKey, recipientId)` makes its row
    // writes skip rather than notifying twice.
    expect(second.requestId).not.toBe(first.requestId);
    expect(second.createdCount).toBe(0);
    expect(await prisma.notification.count()).toBe(2);
    expect(await prisma.notificationRequest.count()).toBe(2);
  });

  it('replaying a bulk fan-out of a non-collapsing type notifies again', async () => {
    const recipientIds = await createUsers(2);
    const service = createService({
      queue: createFakeQueue(),
      channel: createRecordingChannel(),
    });
    const input = { recipientIds, params: { text: 'hello' } };

    await service.notifyMany(GENERIC_NOTIFICATION_TYPE, input);
    await service.notifyMany(GENERIC_NOTIFICATION_TYPE, input);

    // Documented behaviour, not an accident: a type deriving no group key gets
    // one scoped to its request, so each fan-out is its own dispatch and a
    // caller that wants collapsing declares a `groupKey` on the type.
    expect(await prisma.notification.count()).toBe(4);
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

/**
 * A batched type standing in for a real aggregate: `resolveParams` reports the
 * running total, plus how much of it is new when handed a boundary.
 *
 * `events` is the fake domain table; `windows` records every `since` the type
 * was asked about, so tests can assert the window and not just the result.
 */
function createDeltaType(events: { at: Date }[]): {
  type: AnyNotificationType;
  windows: (Date | null)[];
} {
  const windows: (Date | null)[] = [];
  const type = defineBatchedNotificationType({
    key: 'test.delta',
    version: 1,
    inputSchema: z.object({ threadId: z.string() }),
    groupKey: ({ threadId }) => `thread:${threadId}`,
    paramsSchema: z.object({
      threadId: z.string(),
      total: z.number(),
      newCount: z.number().optional(),
    }),
    channels: ['inApp', 'email'],
    resolveParams: ({ threadId }, { since }) => {
      windows.push(since);
      return Promise.resolve({
        threadId,
        total: events.length,
        ...(since === null
          ? {}
          : { newCount: events.filter((e) => e.at > since).length }),
      });
    },
    render: (params) => ({
      title:
        params.newCount === undefined
          ? `${params.total} in total`
          : `${params.newCount} new`,
    }),
  });
  return { type, windows };
}

/** Settles one row's email delivery, so the next send has an anchor. */
async function deliver(
  service: ReturnType<typeof createService>,
  notificationId: string,
): Promise<void> {
  await service.outbox.deliverChunk({
    requestId: 'req',
    channel: 'email',
    notificationIds: [notificationId],
  });
}

describe('delivery-time resolution (delta anchors)', () => {
  beforeEach(resetTables);
  afterAll(resetTables);

  it('sends a delta while the row goes on holding state', async () => {
    const recipientId = await createUser(0);
    const events = [{ at: new Date('2026-01-01') }];
    const { type } = createDeltaType(events);
    const channel = createRecordingChannel();
    const service = createService({
      queue: createFakeQueue(),
      channel,
      notificationTypes: [type],
    });

    await service.notify(type, { recipientId, input: { threadId: 't1' } });
    const row = await prisma.notification.findFirstOrThrow({
      where: { recipientId },
      select: { id: true, params: true, frozenContent: true },
    });

    // Nothing delivered before, so there is no boundary and the message states
    // how things stand rather than what changed.
    await deliver(service, row.id);
    expect(channel.deliveries).toHaveLength(1);
    expect(channel.deliveries[0]?.params).toMatchObject({ total: 1 });
    expect(channel.deliveries[0]?.params).not.toHaveProperty('newCount');

    // The delta proper: measured from the first delivery, only the new event
    // counts.
    events.push({ at: new Date() });
    await service.notify(type, { recipientId, input: { threadId: 't1' } });
    const rearmed = await prisma.notification.findFirstOrThrow({
      where: { recipientId },
      select: { id: true },
    });
    await deliver(service, rearmed.id);

    expect(channel.deliveries).toHaveLength(2);
    expect(channel.deliveries[1]?.params).toMatchObject({
      total: 2,
      newCount: 1,
    });
  });

  it('never writes the delta back to the row', async () => {
    const recipientId = await createUser(0);
    const events = [{ at: new Date('2026-01-01') }, { at: new Date() }];
    const { type } = createDeltaType(events);
    const channel = createRecordingChannel();
    const service = createService({
      queue: createFakeQueue(),
      channel,
      notificationTypes: [type],
    });

    await service.notify(type, { recipientId, input: { threadId: 't1' } });
    const first = await prisma.notification.findFirstOrThrow({
      where: { recipientId },
      select: { id: true },
    });
    // Delivered once, so the second send has an anchor.
    await deliver(service, first.id);

    events.push({ at: new Date() });
    await service.notify(type, { recipientId, input: { threadId: 't1' } });
    const before = await prisma.notification.findFirstOrThrow({
      where: { recipientId },
      select: { id: true, params: true, frozenContent: true },
    });

    await deliver(service, before.id);

    const after = await prisma.notification.findUniqueOrThrow({
      where: { id: before.id },
      select: { params: true, frozenContent: true },
    });

    // The delta reached the channel; the row is untouched by it.
    expect(channel.deliveries.at(-1)?.params).toMatchObject({ newCount: 1 });
    expect(after.params).toEqual(before.params);
    expect(after.frozenContent).toEqual(before.frozenContent);
    expect(after.params).not.toHaveProperty('newCount');
  });

  it('widens the window when a delivery is skipped as stale', async () => {
    const recipientId = await createUser(0);
    const events = [{ at: new Date('2026-01-01') }];
    const { type, windows } = createDeltaType(events);
    const channel = createRecordingChannel();
    const service = createService({
      queue: createFakeQueue(),
      channel,
      notificationTypes: [type],
    });

    await service.notify(type, { recipientId, input: { threadId: 't1' } });
    const first = await prisma.notification.findFirstOrThrow({
      where: { recipientId },
      select: { id: true },
    });
    await deliver(service, first.id);
    const anchor = await prisma.notificationDelivery.findFirstOrThrow({
      where: { notificationId: first.id, status: 'delivered' },
      select: { deliveredAt: true },
    });

    // A second generation, armed and then abandoned unsent. A real state
    // change, since an unchanged notify is a no-op and would arm nothing.
    events.push({ at: new Date() });
    await service.notify(type, { recipientId, input: { threadId: 't1' } });
    const expired = await service.outbox.expireStaleDeliveries({
      expireBefore: new Date(Date.now() + 1000),
    });
    expect(expired).toBeGreaterThan(0);

    // A third generation, delivered. Its window must still start at the last
    // real send.
    events.push({ at: new Date() });
    await service.notify(type, { recipientId, input: { threadId: 't1' } });
    const third = await prisma.notification.findFirstOrThrow({
      where: { recipientId },
      select: { id: true },
    });
    await deliver(service, third.id);

    expect(windows.at(-1)).toEqual(anchor.deliveredAt);
  });

  it('falls back to stored state when the delta cannot be computed', async () => {
    const recipientId = await createUser(0);
    const failing = defineBatchedNotificationType({
      key: 'test.delta-failing',
      version: 1,
      inputSchema: z.object({ threadId: z.string() }),
      groupKey: ({ threadId }) => `thread:${threadId}`,
      paramsSchema: z.object({ threadId: z.string(), total: z.number() }),
      channels: ['inApp', 'email'],
      resolveParams: ({ threadId }, { since }) => {
        // Succeeds on the write path, then fails permanently, the way a
        // deleted entity does.
        if (since !== null) throw new Error('thread is gone');
        return Promise.resolve({ threadId, total: 7 });
      },
      render: (params) => ({ title: `${params.total} in total` }),
    });
    const channel = createRecordingChannel();
    const service = createService({
      queue: createFakeQueue(),
      channel,
      notificationTypes: [failing],
    });

    await service.notify(failing, { recipientId, input: { threadId: 't1' } });
    const row = await prisma.notification.findFirstOrThrow({
      where: { recipientId },
      select: { id: true },
    });

    const result = await service.outbox.deliverChunk({
      requestId: 'req',
      channel: 'email',
      notificationIds: [row.id],
    });

    // Delivered, not failed: the stored state is still worth sending.
    expect(result).toMatchObject({ delivered: 1, errored: 0 });
    expect(channel.deliveries[0]?.params).toMatchObject({ total: 7 });
  });
});

describe('retractAll', () => {
  beforeEach(resetTables);
  afterAll(resetTables);

  it('clears every recipient holding the key, in one sweep', async () => {
    const recipientIds = await createUsers(5);
    const published: { userId: string; count: number }[] = [];
    const service = createService({
      queue: createFakeQueue(),
      channel: createRecordingChannel(),
      publishUnseenCount: (userId, count) => published.push({ userId, count }),
    });

    await service.notifyMany(LIKE_THREAD_TYPE, {
      recipientIds,
      params: { postId: 'p1', text: 'liked' },
    });
    // A second key, to prove the sweep is scoped rather than a blanket clear.
    await service.notifyMany(LIKE_THREAD_TYPE, {
      recipientIds,
      params: { postId: 'p2', text: 'liked' },
    });
    published.length = 0;

    const { retractedCount } = await service.retractAll(LIKE_THREAD_TYPE, {
      params: { postId: 'p1', text: 'liked' },
    });

    expect(retractedCount).toBe(5);
    expect(
      await prisma.notification.count({
        where: { groupKey: 'post:p1:likes', dismissedAt: null },
      }),
    ).toBe(0);
    // The untouched key still stands.
    expect(
      await prisma.notification.count({
        where: { groupKey: 'post:p2:likes', dismissedAt: null },
      }),
    ).toBe(5);
    // Every recipient's badge was corrected, since all five rows were unseen.
    expect(new Set(published.map((p) => p.userId))).toEqual(
      new Set(recipientIds),
    );
  });

  it('settles pending deliveries so a debounced send never leaves', async () => {
    const recipientIds = await createUsers(3);
    const service = createService({
      queue: createFakeQueue(),
      channel: createRecordingChannel(),
    });

    await service.notifyMany(LIKE_THREAD_EMAIL_TYPE, {
      recipientIds,
      params: { postId: 'p1', text: 'liked' },
    });
    expect(
      await prisma.notificationDelivery.count({ where: { status: 'pending' } }),
    ).toBe(3);

    await service.retractAll(LIKE_THREAD_EMAIL_TYPE, {
      params: { postId: 'p1', text: 'liked' },
    });

    expect(
      await prisma.notificationDelivery.count({ where: { status: 'pending' } }),
    ).toBe(0);
    expect(
      await prisma.notificationDelivery.count({
        where: { status: 'skipped', lastError: 'retracted' },
      }),
    ).toBe(3);
  });

  it('reports nothing withdrawn when the fact is already gone', async () => {
    const service = createService({
      queue: createFakeQueue(),
      channel: createRecordingChannel(),
    });

    // Racing retention, or a caller retracting twice — both benign.
    const { retractedCount } = await service.retractAll(LIKE_THREAD_TYPE, {
      params: { postId: 'nobody', text: 'liked' },
    });

    expect(retractedCount).toBe(0);
  });

  it('refuses a type that derives no group key', async () => {
    const service = createService({
      queue: createFakeQueue(),
      channel: createRecordingChannel(),
    });

    // Such a type writes a fresh row per call, so no single row is named.
    await expect(
      service.retractAll(GENERIC_NOTIFICATION_TYPE, {
        params: { text: 'hello' },
      }),
    ).rejects.toThrow(/derives no group key/);
  });
});

/**
 * Digest routing and sending.
 *
 * The invariant under test throughout: a digest row never reaches the delivery
 * queue, and the scan collapses a whole window — across requests — into one
 * message per (recipient, channel).
 */
/**
 * Belongs to `general`, so the digest tests can move its email preference.
 * Its own key, since `createService` always registers `generic@1`.
 */
const DIGESTABLE_TYPE = defineNotificationType({
  ...GENERIC_NOTIFICATION_TYPE,
  key: 'test.digestable',
  channels: ['inApp', 'email'],
});

/** One digest send as the channel saw it. */
interface RecordedDigest {
  recipientId: string;
  email: string | null;
  notificationIds: string[];
}

/** Records digest sends alongside single ones, so a test can tell them apart. */
function createDigestChannel(
  options: { failing?: boolean } = {},
): NotificationChannel & {
  digests: RecordedDigest[];
  singles: string[];
} {
  const digests: RecordedDigest[] = [];
  const singles: string[] = [];
  return {
    digests,
    singles,
    deliver: ({ notification }) => {
      singles.push(notification.id);
      return Promise.resolve();
    },
    deliverDigest: ({ recipientId, notifications, recipient }) => {
      if (options.failing) {
        return Promise.reject(new Error('digest send failed'));
      }
      digests.push({
        recipientId,
        email: recipient.email,
        notificationIds: notifications.map((n) => n.id),
      });
      return Promise.resolve();
    },
  };
}

/** A channel with no `deliverDigest`, to exercise the per-row fallback. */
function createUnbatchedChannel(): NotificationChannel & {
  singles: string[];
} {
  const singles: string[] = [];
  return {
    singles,
    deliver: ({ notification }) => {
      singles.push(notification.id);
      return Promise.resolve();
    },
  };
}

/** Puts this user's `general` email channel into digest mode. */
async function setEmailDigest(
  userId: string,
  digestWindowSeconds?: number,
): Promise<void> {
  await prisma.notificationPreference.create({
    data: {
      userId,
      topicKey: 'general',
      channel: 'email',
      mode: 'digest',
      digestWindowSeconds,
    },
  });
}

/** Every delivery row for a recipient, for asserting on what was settled. */
async function readDeliveries(
  recipientId: string,
): Promise<{ status: string; mode: string; lastError: string | null }[]> {
  return prisma.notificationDelivery.findMany({
    where: { recipientId },
    select: { status: true, mode: true, lastError: true },
    orderBy: { id: 'asc' },
  });
}

describe('digests', () => {
  beforeEach(resetDigestTables);
  afterAll(resetDigestTables);

  it('marks a digest-routed delivery and keeps it off the queue', async () => {
    const userId = await createUser(1);
    await setEmailDigest(userId);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createDigestChannel(),
      notificationTypes: [DIGESTABLE_TYPE],
    });

    await service.notify(DIGESTABLE_TYPE, {
      recipientId: userId,
      params: { text: 'first' },
    });

    const deliveries = await readDeliveries(userId);
    expect(deliveries).toEqual([
      { status: 'pending', mode: 'digest', lastError: null },
    ]);

    // The whole point: enqueuing it would send one email per notification.
    expect(queue.enqueued).toHaveLength(0);
  });

  it('still routes an immediate recipient through the queue', async () => {
    const userId = await createUser(2);
    const queue = createFakeQueue();
    const service = createService({
      queue,
      channel: createDigestChannel(),
      notificationTypes: [DIGESTABLE_TYPE],
    });

    // No preference row, so the topic default (`immediate`) applies.
    await service.notify(DIGESTABLE_TYPE, {
      recipientId: userId,
      params: { text: 'first' },
    });

    expect(await readDeliveries(userId)).toEqual([
      { status: 'pending', mode: 'immediate', lastError: null },
    ]);
    expect(queue.enqueued).toHaveLength(1);
  });

  it('collapses a burst across requests into one message', async () => {
    const userId = await createUser(3);
    // Already due, so the first pass picks it up.
    await setEmailDigest(userId, 0);
    const channel = createDigestChannel();
    const service = createService({
      queue: createFakeQueue(),
      channel,
      notificationTypes: [DIGESTABLE_TYPE],
    });

    for (const text of ['one', 'two', 'three']) {
      await service.notify(DIGESTABLE_TYPE, {
        recipientId: userId,
        params: { text },
      });
    }

    const result = await service.outbox.sendDueDigests({
      dueBefore: new Date(),
      maxPairs: 10,
    });

    expect(result.sentCount).toBe(1);
    expect(result.deliveredCount).toBe(3);
    expect(channel.digests).toHaveLength(1);
    expect(channel.digests[0]?.notificationIds).toHaveLength(3);
    expect(channel.digests[0]?.email).toBe('outbox-3@example.com');
    // Settled together, so a second pass has nothing to send.
    expect(await readDeliveries(userId)).toEqual(
      Array.from({ length: 3 }, () => ({
        status: 'delivered',
        mode: 'digest',
        lastError: null,
      })),
    );
  });

  it('sends nothing on a second pass', async () => {
    const userId = await createUser(4);
    await setEmailDigest(userId, 0);
    const channel = createDigestChannel();
    const service = createService({
      queue: createFakeQueue(),
      channel,
      notificationTypes: [DIGESTABLE_TYPE],
    });

    await service.notify(DIGESTABLE_TYPE, {
      recipientId: userId,
      params: { text: 'one' },
    });

    const due = { dueBefore: new Date(), maxPairs: 10 };
    await service.outbox.sendDueDigests(due);
    const second = await service.outbox.sendDueDigests(due);

    expect(second.sentCount).toBe(0);
    expect(channel.digests).toHaveLength(1);
  });

  it('leaves a window that has not closed alone', async () => {
    const userId = await createUser(5);
    // An hour out, so nothing is due yet.
    await setEmailDigest(userId, 3600);
    const channel = createDigestChannel();
    const service = createService({
      queue: createFakeQueue(),
      channel,
      notificationTypes: [DIGESTABLE_TYPE],
    });

    await service.notify(DIGESTABLE_TYPE, {
      recipientId: userId,
      params: { text: 'one' },
    });

    const result = await service.outbox.sendDueDigests({
      dueBefore: new Date(),
      maxPairs: 10,
    });

    expect(result.sentCount).toBe(0);
    expect(channel.digests).toHaveLength(0);
    expect(await readDeliveries(userId)).toEqual([
      { status: 'pending', mode: 'digest', lastError: null },
    ]);
  });

  it('drains rows that are not yet due once the oldest one is', async () => {
    const userId = await createUser(6);
    await setEmailDigest(userId, 3600);
    const channel = createDigestChannel();
    const service = createService({
      queue: createFakeQueue(),
      channel,
      notificationTypes: [DIGESTABLE_TYPE],
    });

    // Two rows an hour out, then one backdated so the pair comes due.
    await service.notify(DIGESTABLE_TYPE, {
      recipientId: userId,
      params: { text: 'later one' },
    });
    await service.notify(DIGESTABLE_TYPE, {
      recipientId: userId,
      params: { text: 'later two' },
    });
    const { id: oldestId } = await prisma.notificationDelivery.findFirstOrThrow(
      {
        where: { recipientId: userId },
        select: { id: true },
        orderBy: { id: 'asc' },
      },
    );
    await prisma.notificationDelivery.update({
      where: { id: oldestId },
      data: { digestDueAt: new Date(Date.now() - 1000) },
    });

    const result = await service.outbox.sendDueDigests({
      dueBefore: new Date(),
      maxPairs: 10,
    });

    // All three go, not just the due one: the window has closed for this
    // recipient, so the newer rows ride along rather than waiting.
    expect(result.deliveredCount).toBe(2);
    expect(channel.digests[0]?.notificationIds).toHaveLength(2);
  });

  it('skips rows the recipient unsubscribed from mid-window', async () => {
    const userId = await createUser(7);
    await setEmailDigest(userId, 0);
    const channel = createDigestChannel();
    const service = createService({
      queue: createFakeQueue(),
      channel,
      notificationTypes: [DIGESTABLE_TYPE],
    });

    await service.notify(DIGESTABLE_TYPE, {
      recipientId: userId,
      params: { text: 'one' },
    });

    // The unsubscribe lands after the row was routed but before it is sent —
    // the window is exactly the time a digest gives someone to change this.
    await prisma.notificationPreference.updateMany({
      where: { userId, topicKey: 'general', channel: 'email' },
      data: { mode: 'off' },
    });

    const result = await service.outbox.sendDueDigests({
      dueBefore: new Date(),
      maxPairs: 10,
    });

    expect(result.sentCount).toBe(0);
    expect(channel.digests).toHaveLength(0);
    expect(await readDeliveries(userId)).toEqual([
      { status: 'skipped', mode: 'digest', lastError: 'unsubscribed' },
    ]);
  });

  it('leaves rows pending when the send throws', async () => {
    const userId = await createUser(8);
    await setEmailDigest(userId, 0);
    const channel = createDigestChannel({ failing: true });
    const service = createService({
      queue: createFakeQueue(),
      channel,
      notificationTypes: [DIGESTABLE_TYPE],
    });

    await service.notify(DIGESTABLE_TYPE, {
      recipientId: userId,
      params: { text: 'one' },
    });

    const result = await service.outbox.sendDueDigests({
      dueBefore: new Date(),
      maxPairs: 10,
    });

    expect(result.erroredCount).toBe(1);
    // Still pending, so the next pass retries them with whatever arrived since.
    expect(await readDeliveries(userId)).toEqual([
      { status: 'pending', mode: 'digest', lastError: null },
    ]);
  });

  it('keeps one failing recipient from stranding another', async () => {
    const [failingUser, healthyUser] = [
      await createUser(9),
      await createUser(10),
    ];
    await setEmailDigest(failingUser, 0);
    await setEmailDigest(healthyUser, 0);

    // Fails only the first recipient it is asked to send to.
    const digests: RecordedDigest[] = [];
    const channel: NotificationChannel = {
      deliver: () => Promise.resolve(),
      deliverDigest: ({ recipientId, notifications, recipient }) => {
        if (recipientId === failingUser) {
          return Promise.reject(new Error('digest send failed'));
        }
        digests.push({
          recipientId,
          email: recipient.email,
          notificationIds: notifications.map((n) => n.id),
        });
        return Promise.resolve();
      },
    };
    const service = createService({
      queue: createFakeQueue(),
      channel,
      notificationTypes: [DIGESTABLE_TYPE],
    });

    for (const recipientId of [failingUser, healthyUser]) {
      await service.notify(DIGESTABLE_TYPE, {
        recipientId,
        params: { text: 'one' },
      });
    }

    const result = await service.outbox.sendDueDigests({
      dueBefore: new Date(),
      maxPairs: 10,
    });

    expect(result.erroredCount).toBe(1);
    expect(result.sentCount).toBe(1);
    expect(digests.map((d) => d.recipientId)).toEqual([healthyUser]);
  });

  it('falls back to one send per row when the channel cannot batch', async () => {
    const userId = await createUser(11);
    await setEmailDigest(userId, 0);
    const channel = createUnbatchedChannel();
    const service = createService({
      queue: createFakeQueue(),
      channel,
      notificationTypes: [DIGESTABLE_TYPE],
    });

    for (const text of ['one', 'two']) {
      await service.notify(DIGESTABLE_TYPE, {
        recipientId: userId,
        params: { text },
      });
    }

    const result = await service.outbox.sendDueDigests({
      dueBefore: new Date(),
      maxPairs: 10,
    });

    // The window still collapsed — this is one send per row, not one per
    // event — but there is no single message to fold them into.
    expect(result.deliveredCount).toBe(2);
    expect(channel.singles).toHaveLength(2);
  });
});
