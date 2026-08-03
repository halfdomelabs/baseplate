import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { QueueService } from '@src/types/queue.types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { GENERIC_NOTIFICATION_TYPE } from '@src/modules/notifications/services/generic-type.js';
import { createNotificationOutbox } from '@src/modules/notifications/services/notification-outbox.js';
import { createNotificationRenderer } from '@src/modules/notifications/services/notification-renderer.js';
import { createNotificationService } from '@src/modules/notifications/services/notification.service.js';
import { prisma } from '@src/services/prisma.js';

import { POST_LIKED_TYPE } from '../notifications/blog-notification-types.js';
import { likeBlogPost, unlikeBlogPost } from './blog-post-like.service.js';

/**
 * The end-to-end case keyed notifications exist for: many likes on one post
 * collapse into one feed row that updates in place, and undoing the last like
 * withdraws it.
 */

function createFakeQueue(): QueueService {
  return {
    enqueue: vi.fn<QueueService['enqueue']>(() => Promise.resolve('job-id')),
    enqueueBulk: vi.fn<QueueService['enqueueBulk']>((_token, jobs) =>
      Promise.resolve(jobs.map(() => 'job-id')),
    ),
  };
}

/** Badge broadcasts, so tests can assert the bell was actually updated. */
type PublishedCounts = { userId: string; count: number }[];

/** Wires the real services the way the composition root does. */
function createContext(
  userId: string,
  published: PublishedCounts = [],
): ServiceContext {
  const renderer = createNotificationRenderer({
    notificationTypes: [GENERIC_NOTIFICATION_TYPE, POST_LIKED_TYPE],
  });
  const outbox = createNotificationOutbox({
    // POST_LIKED_TYPE is in-app only, so nothing reaches this — it exists to
    // satisfy the channel map's shape.
    channels: { email: { deliver: vi.fn() } },
    queue: createFakeQueue(),
  });
  const notification = createNotificationService({
    events: {
      publishUnseenCount: (recipientId: string, count: number) => {
        published.push({ userId: recipientId, count });
      },
      subscribeToUnseenCount: vi.fn(),
    },
    renderer,
    outbox,
  });
  return {
    auth: { userIdOrThrow: () => userId },
    services: { notification },
  } as unknown as ServiceContext;
}

let seq = 0;

async function createUser(): Promise<{ id: string; name: string }> {
  seq += 1;
  const name = `User ${seq}`;
  const user = await prisma.user.create({
    data: { email: `like-${seq}@test.com`, name },
    select: { id: true },
  });
  return { id: user.id, name };
}

async function createPost(publisherId: string): Promise<string> {
  const blog = await prisma.blog.create({
    data: { name: `Blog ${(seq += 1)}`, userId: publisherId },
    select: { id: true },
  });
  const post = await prisma.blogPost.create({
    data: {
      blogId: blog.id,
      publisherId,
      title: 'Hello world',
      content: 'body',
    },
    select: { id: true },
  });
  return post.id;
}

async function resetTables(): Promise<void> {
  await prisma.notification.deleteMany();
  await prisma.notificationRequest.deleteMany();
  await prisma.blogPostLike.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.user.deleteMany();
}

beforeEach(resetTables);
afterAll(resetTables);

describe('blog post likes', () => {
  it('collapses many likes into one notification that names the latest liker', async () => {
    const author = await createUser();
    const alice = await createUser();
    const bob = await createUser();
    const postId = await createPost(author.id);

    await likeBlogPost(postId, createContext(alice.id));
    await likeBlogPost(postId, createContext(bob.id));

    const rows = await prisma.notification.findMany({
      where: { recipientId: author.id },
      select: { fallbackText: true, params: true },
    });

    // One row, not one per like — that is the whole point.
    expect(rows).toHaveLength(1);
    expect(rows[0]?.fallbackText).toBe(
      `${bob.name} and 1 other liked Hello world`,
    );
    expect(rows[0]?.params).toMatchObject({ count: 2 });
  });

  it('resurfaces the row when a further like changes the state', async () => {
    const author = await createUser();
    const alice = await createUser();
    const bob = await createUser();
    const postId = await createPost(author.id);

    await likeBlogPost(postId, createContext(alice.id));
    const before = await prisma.notification.findFirstOrThrow({
      where: { recipientId: author.id },
      select: { id: true, feedOrderId: true },
    });

    await likeBlogPost(postId, createContext(bob.id));
    const after = await prisma.notification.findFirstOrThrow({
      where: { recipientId: author.id },
      select: { id: true, feedOrderId: true },
    });

    // Same row — deliveries cascade off `id` — but a new sort key, so it
    // returns to the top of the feed.
    expect(after.id).toBe(before.id);
    expect(after.feedOrderId).not.toBe(before.feedOrderId);
  });

  it('leaves the row untouched when the same like is retried', async () => {
    const author = await createUser();
    const alice = await createUser();
    const postId = await createPost(author.id);
    const context = createContext(alice.id);

    await likeBlogPost(postId, context);
    const before = await prisma.notification.findFirstOrThrow({
      where: { recipientId: author.id },
      select: { feedOrderId: true, seenAt: true },
    });
    await prisma.notification.updateMany({
      where: { recipientId: author.id },
      data: { seenAt: new Date() },
    });

    await likeBlogPost(postId, context);

    const after = await prisma.notification.findFirstOrThrow({
      where: { recipientId: author.id },
      select: { feedOrderId: true, seenAt: true },
    });

    // Recomputed to the same state, so nothing is rewritten and an
    // acknowledged row is not dragged back to unseen.
    expect(after.feedOrderId).toBe(before.feedOrderId);
    expect(after.seenAt).not.toBeNull();
  });

  it('withdraws the notification when the last like is undone', async () => {
    const author = await createUser();
    const alice = await createUser();
    const postId = await createPost(author.id);
    const context = createContext(alice.id);

    await likeBlogPost(postId, context);
    await unlikeBlogPost(postId, context);

    const row = await prisma.notification.findFirstOrThrow({
      where: { recipientId: author.id },
      select: { dismissedAt: true },
    });

    expect(row.dismissedAt).not.toBeNull();
  });

  it('revives the notification when the same user likes again', async () => {
    const author = await createUser();
    const alice = await createUser();
    const postId = await createPost(author.id);
    const published: PublishedCounts = [];
    const context = createContext(alice.id, published);

    await likeBlogPost(postId, context);
    await unlikeBlogPost(postId, context);
    published.length = 0;
    await likeBlogPost(postId, context);

    const row = await prisma.notification.findFirstOrThrow({
      where: { recipientId: author.id },
      select: { dismissedAt: true, params: true },
    });

    // The recomputed state is identical to what the retracted row still holds,
    // so an equality check alone would treat the re-like as a no-op and leave
    // the notification withdrawn.
    expect(await prisma.notification.count()).toBe(1);
    expect(row.dismissedAt).toBeNull();
    expect(row.params).toMatchObject({ count: 1 });
    // Reviving puts the row back in the unseen count, so the bell has to hear
    // about it — a row coming back from retracted moves the badge.
    expect(published).toEqual([{ userId: author.id, count: 1 }]);
  });

  it('shrinks the count when one of several likes is undone', async () => {
    const author = await createUser();
    const alice = await createUser();
    const bob = await createUser();
    const postId = await createPost(author.id);

    await likeBlogPost(postId, createContext(alice.id));
    await likeBlogPost(postId, createContext(bob.id));
    await unlikeBlogPost(postId, createContext(bob.id));

    const row = await prisma.notification.findFirstOrThrow({
      where: { recipientId: author.id },
      select: { fallbackText: true, dismissedAt: true, params: true },
    });

    // Replace-downward: the row survives, still visible, with the smaller
    // count a fold would have got wrong.
    expect(row.dismissedAt).toBeNull();
    expect(row.params).toMatchObject({ count: 1 });
    expect(row.fallbackText).toBe(`${alice.name} liked Hello world`);
  });

  it('does not notify an author who likes their own post', async () => {
    const author = await createUser();
    const postId = await createPost(author.id);

    await likeBlogPost(postId, createContext(author.id));

    expect(await prisma.notification.count()).toBe(0);
  });
});
