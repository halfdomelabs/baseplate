import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';

import { POST_LIKED_TYPE } from '../notifications/blog-notification-types.js';

/**
 * How many likers a notification names before collapsing the rest into a count.
 * Bounded so the stored params never grow with a viral post.
 */
const ACTOR_SAMPLE_SIZE = 3;

/** Identifies the like-notification for a post, per recipient. */
function likeNotificationKey(postId: string): string {
  return `blogPost:${postId}:likes`;
}

/**
 * Recompute the post's like state and tell the notification service about it.
 *
 * Both `likeBlogPost` and `unlikeBlogPost` end here, which is the contract a
 * keyed notification places on its caller: the likes table is the source of
 * truth, so every change recomputes the whole aggregate rather than nudging a
 * stored counter. At zero the notification is withdrawn.
 *
 * The author is not notified about their own like, so a post whose only liker
 * is its author has nothing to say.
 */
async function syncLikeNotification(
  postId: string,
  context: ServiceContext,
): Promise<void> {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { id: true, title: true, publisherId: true },
  });
  if (!post) return;

  const [likes, count] = await Promise.all([
    prisma.blogPostLike.findMany({
      where: { postId, userId: { not: post.publisherId } },
      orderBy: { createdAt: 'desc' },
      take: ACTOR_SAMPLE_SIZE,
      select: { userId: true, user: { select: { name: true } } },
    }),
    prisma.blogPostLike.count({
      where: { postId, userId: { not: post.publisherId } },
    }),
  ]);

  const key = likeNotificationKey(postId);

  if (count === 0) {
    await context.services.notification.retract(POST_LIKED_TYPE, {
      recipientId: post.publisherId,
      key,
    });
    return;
  }

  await context.services.notification.notify(POST_LIKED_TYPE, {
    recipientId: post.publisherId,
    key,
    // The most recent liker, for the row's live actor relation.
    actorId: likes[0]?.userId,
    entityType: 'blogPost',
    entityId: post.id,
    params: {
      postId: post.id,
      postTitle: post.title,
      likerNames: likes.map((like) => like.user.name ?? 'Someone'),
      count,
    },
  });
}

/** Like a post. Idempotent: liking twice leaves one like and one notification. */
export async function likeBlogPost(
  postId: string,
  context: ServiceContext,
): Promise<void> {
  const userId = context.auth.userIdOrThrow();
  await prisma.blogPostLike.createMany({
    data: [{ postId, userId }],
    skipDuplicates: true,
  });
  await syncLikeNotification(postId, context);
}

/** Remove a like. Idempotent, and withdraws the notification at zero. */
export async function unlikeBlogPost(
  postId: string,
  context: ServiceContext,
): Promise<void> {
  const userId = context.auth.userIdOrThrow();
  await prisma.blogPostLike.deleteMany({ where: { postId, userId } });
  await syncLikeNotification(postId, context);
}
