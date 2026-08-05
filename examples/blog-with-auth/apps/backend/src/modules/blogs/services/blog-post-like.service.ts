import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';

import { POST_LIKED_TYPE } from '../notifications/blog-notification-types.js';

/** The like state a `post.liked` notification renders from. */
export interface BlogPostLikeSummary {
  postId: string;
  postTitle: string;
  likerNames: string[];
  count: number;
  /**
   * Likes since the recipient was last told. Absent on the write path, where
   * there is no boundary, which keeps it out of the stored params.
   */
  newCount?: number;
}

/**
 * The post's current like state, as `POST_LIKED_TYPE.resolveParams` reads it.
 *
 * The likes table is the source of truth, so this recomputes the whole aggregate
 * rather than nudging a stored counter. The author's own like is excluded — you
 * are not notified about liking your own post.
 *
 * Read-only and idempotent, because it also runs inside the delivery worker's
 * retry path.
 *
 * With `since`, additionally counts what is new to the recipient. The sample
 * and total still describe the whole post.
 */
export async function summarizePostLikes(
  postId: string,
  sampleSize: number,
  since?: Date | null,
): Promise<BlogPostLikeSummary> {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { id: true, title: true, publisherId: true },
  });
  if (!post) {
    throw new Error(`Blog post ${postId} not found`);
  }

  const scope = { postId, userId: { not: post.publisherId } };

  const [likes, count, newCount] = await Promise.all([
    prisma.blogPostLike.findMany({
      where: scope,
      orderBy: { createdAt: 'desc' },
      take: sampleSize,
      select: { user: { select: { name: true } } },
    }),
    prisma.blogPostLike.count({ where: scope }),
    // Skipped without a boundary, so the write path costs what it did before.
    since
      ? prisma.blogPostLike.count({
          where: { ...scope, createdAt: { gt: since } },
        })
      : undefined,
  ]);

  return {
    postId: post.id,
    postTitle: post.title,
    likerNames: likes.map((like) => like.user.name ?? 'Someone'),
    count,
    ...(newCount === undefined ? {} : { newCount }),
  };
}

/**
 * Tell the notification service the post's like state changed.
 *
 * Both `likeBlogPost` and `unlikeBlogPost` end here. Neither computes params or
 * a key: the type derives both, which is what guarantees the notify side and
 * the retract side name the same row. At zero the notification is withdrawn.
 */
async function syncLikeNotification(
  postId: string,
  context: ServiceContext,
): Promise<void> {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { publisherId: true },
  });
  if (!post) return;

  const count = await prisma.blogPostLike.count({
    where: { postId, userId: { not: post.publisherId } },
  });

  if (count === 0) {
    await context.services.notification.retract(POST_LIKED_TYPE, {
      recipientId: post.publisherId,
      input: { postId },
    });
    return;
  }

  await context.services.notification.notify(POST_LIKED_TYPE, {
    recipientId: post.publisherId,
    input: { postId },
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
