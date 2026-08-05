import { prisma } from '@src/services/prisma.js';

/**
 * Sample likers, seeded so a batched like notification has rows to summarize.
 *
 * Ordered, and drawn from in sequence: each call adds the next name that is not
 * already a liker, so the like count really changes between runs. Without that
 * a repeat `notify` recomputes identical params and is correctly absorbed as a
 * no-op, which looks like the script doing nothing.
 */
const LIKER_NAMES = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Katherine Johnson',
  'Barbara Liskov',
  'Edsger Dijkstra',
];

/** Deterministic address for a seeded liker, so re-runs reuse the same user. */
function likerEmail(name: string): string {
  return `${name.split(' ')[0]?.toLowerCase() ?? 'liker'}@example.com`;
}

/**
 * A post the given user published, with likes from other users.
 *
 * Shared by the notification dev scripts: `POST_LIKED_TYPE` is a batched type
 * that reads the like table rather than taking a count, so it needs real rows,
 * and `POST_COMMENTED_TYPE` needs a post id its action URL can point at.
 *
 * Everything is found-or-created, so re-running a script reuses the same post
 * rather than accumulating one per run. Each run does add one more liker, so
 * the like aggregate really changes; once {@link LIKER_NAMES} is exhausted a
 * repeat `notify` is correctly absorbed as a no-op and returns a null request.
 */
export async function seedDemoPost(publisherId: string): Promise<string> {
  const blog = await prisma.blog.findFirst({
    where: { userId: publisherId },
    select: { id: true },
  });
  const blogId =
    blog?.id ??
    (
      await prisma.blog.create({
        data: { name: 'Notification demo blog', userId: publisherId },
        select: { id: true },
      })
    ).id;

  const existing = await prisma.blogPost.findFirst({
    where: { blogId, publisherId, title: 'Hello world' },
    select: { id: true },
  });
  const postId =
    existing?.id ??
    (
      await prisma.blogPost.create({
        data: {
          blogId,
          publisherId,
          title: 'Hello world',
          content: 'Seeded by the notification dev scripts.',
        },
        select: { id: true },
      })
    ).id;

  // Likers other than the author: a post's own publisher is excluded from the
  // summary, so liking it as the recipient would leave the count at zero.
  const likerIds = await Promise.all(
    LIKER_NAMES.map(async (name) => {
      const email = likerEmail(name);
      const { id } = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name },
        select: { id: true },
      });
      return id;
    }),
  );

  const existingLikes = new Set(
    (
      await prisma.blogPostLike.findMany({
        where: { postId, userId: { in: likerIds } },
        select: { userId: true },
      })
    ).map((like) => like.userId),
  );

  // The first run seeds two so the summary reads naturally; later runs add one
  // at a time, so the count moves and a repeat notify is a real change.
  const target = existingLikes.size === 0 ? 2 : existingLikes.size + 1;
  for (const userId of likerIds.slice(0, target)) {
    if (existingLikes.has(userId)) continue;
    await prisma.blogPostLike.create({ data: { postId, userId } });
  }

  return postId;
}
