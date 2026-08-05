#!/usr/bin/env node
import type { NotificationChannelKey } from '@src/modules/notifications/channels/types.js';

import {
  POST_COMMENTED_TYPE,
  POST_LIKED_TYPE,
  SECURITY_ALERT_TYPE,
} from '@src/modules/blogs/notifications/blog-notification-types.js';
import { prisma } from '@src/services/prisma.js';

import { withScriptContext } from '../utils/service-context.js';

/**
 * Dev helper: seed a burst of notifications for one recipient and print the
 * delivery ledger they landed in.
 *
 *   pnpm script:run src/scripts/send-test-digest.ts <email>
 *
 * Seeding is all it does. Nothing here delivers: digest rows wait for the
 * digest worker's own cron (3,13,23,33,43,53 past the hour) and immediate ones
 * go through the delivery queue, so both lanes are exercised exactly as they
 * would be in production. Run `pnpm dev` (or `pnpm dev:workers`) alongside this
 * and watch the ledger settle on its own.
 *
 * Preferences are read, never written — set them at
 * /admin/notification-preferences first, so what happens here is what the app
 * would really do for that user. `postLikes` defaults its email channel to an
 * hourly digest, so the digest lane is exercised out of the box; put
 * `postComments` on DIGEST too and both collapse.
 *
 * With a topic on DIGEST, one window shows:
 *   - a burst across several requests collapses into ONE message
 *   - a collapsing type replaced repeatedly appears ONCE, not once per update
 *   - a topic-less type ignores the preference and stays immediate
 *
 * Pass `--reset` to clear this recipient's notifications instead of seeding.
 * Preferences are left alone either way.
 */

/** The channel this exercises. Email is the only one that batches today. */
const CHANNEL: NotificationChannelKey = 'email';

/**
 * Topics the seeded types belong to; their preferences decide the lane.
 * `account.securityAlert` belongs to none and is deliberately absent.
 */
const SEEDED_TOPIC_KEYS = ['postComments', 'postLikes'] as const;

/**
 * A post the recipient published, with likes from other users.
 *
 * `POST_LIKED_TYPE` is a batched type: it reads the like table rather than
 * taking a count, so it needs real rows to summarize. Everything here is
 * upserted, so re-running the script reuses the same post.
 */
async function seedLikedPost(recipientId: string): Promise<string> {
  const blog = await prisma.blog.findFirst({
    where: { userId: recipientId },
    select: { id: true },
  });
  const blogId =
    blog?.id ??
    (
      await prisma.blog.create({
        data: { name: 'Digest demo blog', userId: recipientId },
        select: { id: true },
      })
    ).id;

  const existing = await prisma.blogPost.findFirst({
    where: { blogId, publisherId: recipientId, title: 'Hello world' },
    select: { id: true },
  });
  const postId =
    existing?.id ??
    (
      await prisma.blogPost.create({
        data: {
          blogId,
          publisherId: recipientId,
          title: 'Hello world',
          content: 'Seeded by send-test-digest.',
        },
        select: { id: true },
      })
    ).id;

  // Likers other than the author: a post's own publisher is excluded from the
  // summary, so liking it as the recipient would leave the count at zero.
  for (const name of ['Ada Lovelace', 'Grace Hopper']) {
    const liker = await prisma.user.upsert({
      where: { email: `${name.split(' ')[0]?.toLowerCase()}@example.com` },
      update: {},
      create: {
        email: `${name.split(' ')[0]?.toLowerCase()}@example.com`,
        name,
      },
      select: { id: true },
    });
    await prisma.blogPostLike.upsert({
      where: { postId_userId: { postId, userId: liker.id } },
      update: {},
      create: { postId, userId: liker.id },
    });
  }

  return postId;
}

/**
 * Report the recipient's stored preferences for the seeded topics, so the run's
 * output can be read against what they actually chose.
 *
 * Read, never written: the point of an end-to-end run is that the routing came
 * from the user's own settings. No row means the topic default applies.
 */
async function reportPreferences(userId: string): Promise<void> {
  const rows = await prisma.notificationPreference.findMany({
    where: {
      userId,
      topicKey: { in: [...SEEDED_TOPIC_KEYS] },
      channel: CHANNEL,
    },
    select: { topicKey: true, mode: true, digestWindowSeconds: true },
  });
  const byTopic = new Map(rows.map((row) => [row.topicKey, row]));

  for (const topicKey of SEEDED_TOPIC_KEYS) {
    const preference = byTopic.get(topicKey);
    if (!preference) {
      console.info(
        `  ${topicKey}/${CHANNEL}: no preference row — the topic default applies.`,
      );
      continue;
    }
    const window =
      preference.digestWindowSeconds === null
        ? 'topic default window'
        : `window ${preference.digestWindowSeconds}s`;
    console.info(
      `  ${topicKey}/${CHANNEL}: ${preference.mode}${preference.mode === 'digest' ? ` (${window})` : ''}`,
    );
  }
}

/** The delivery ledger for one recipient, as the sweep left it. */
async function printLedger(userId: string): Promise<void> {
  const deliveries = await prisma.notificationDelivery.findMany({
    where: { recipientId: userId },
    select: {
      channel: true,
      mode: true,
      status: true,
      lastError: true,
      notification: { select: { type: true, groupKey: true } },
    },
    orderBy: { id: 'asc' },
  });

  console.info('\nDelivery ledger:');
  for (const delivery of deliveries) {
    const reason = delivery.lastError ? ` (${delivery.lastError})` : '';
    console.info(
      `  ${delivery.notification.type.padEnd(24)} ${delivery.mode.padEnd(9)} ${delivery.status}${reason}`,
    );
  }
}

function usage(): string {
  return [
    'Usage: pnpm script:run src/scripts/send-test-digest.ts <email> [--reset]',
    '',
    '  <email>   The user to notify. Set their preferences first at',
    '            /admin/notification-preferences — this script never writes them.',
    '  --reset   Clear this recipient’s notifications and exit.',
  ].join('\n');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const emailArg = args.find((arg) => !arg.startsWith('--'));
  const reset = args.includes('--reset');

  // Named rather than defaulted to the first user: this notifies a real
  // account you are signed in as, so guessing the recipient would send someone
  // else's test mail.
  if (!emailArg) {
    throw new Error(`A recipient email is required.\n\n${usage()}`);
  }

  // Looked up rather than created: a typo'd address must fail rather than
  // quietly invent a user nobody is signed in as.
  const recipient = await prisma.user.findUnique({
    where: { email: emailArg },
    select: { id: true },
  });

  if (!recipient) {
    throw new Error(`No user found with email "${emailArg}"`);
  }

  if (reset) {
    const { count } = await prisma.notification.deleteMany({
      where: { recipientId: recipient.id },
    });
    console.info(
      `Cleared ${count} notification(s) for ${emailArg}. Preferences left untouched.`,
    );
    return;
  }

  console.info(`Recipient: ${emailArg}`);
  await reportPreferences(recipient.id);

  const postId = await seedLikedPost(recipient.id);

  await withScriptContext(async (context) => {
    const { notification } = context.services;

    // Three separate requests, so the burst spans requests the way real
    // activity does — a digest collapses across them, not just within one.
    for (const commenterName of [
      'Ada Lovelace',
      'Grace Hopper',
      'Alan Turing',
    ]) {
      await notification.notify(POST_COMMENTED_TYPE, {
        recipientId: recipient.id,
        params: {
          postId,
          postTitle: 'Hello world',
          commenterName,
        },
      });
    }

    // A collapsing type, notified twice: one row replaced in place, leaving two
    // pending generations behind it. The digest must carry it ONCE.
    for (let i = 0; i < 2; i += 1) {
      await notification.notify(POST_LIKED_TYPE, {
        recipientId: recipient.id,
        input: { postId },
      });
    }

    // Topic-less, so it consults no preference: this one stays immediate and
    // should never appear in the digest lane at all.
    await notification.notify(SECURITY_ALERT_TYPE, {
      recipientId: recipient.id,
      params: { action: 'New sign-in', ipAddress: '203.0.113.4' },
    });

    console.info(
      '\nSeeded. Digest rows stay pending until the digest worker runs (3,13,23,33,43,53 past the hour); immediate ones are already queued.',
    );
    await printLedger(recipient.id);
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit();
  });
