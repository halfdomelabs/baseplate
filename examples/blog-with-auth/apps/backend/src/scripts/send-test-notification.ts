#!/usr/bin/env node
import type { NotificationService } from '@src/modules/notifications/services/notification.service.js';

import {
  POST_COMMENTED_TYPE,
  POST_LIKED_TYPE,
  SECURITY_ALERT_TYPE,
} from '@src/modules/blogs/notifications/blog-notification-types.js';
import { prisma } from '@src/services/prisma.js';

import { withScriptContext } from '../utils/service-context.js';
import { seedDemoPost } from './seed-demo-post.js';

/**
 * Dev helper: fire a notification at a user so you can watch the admin bell
 * update live over SSE, and see notification preferences take effect. Run it in
 * the same env as the dev server so it publishes to the same Redis the server
 * subscribes to:
 *
 *   pnpm script:run src/scripts/send-test-notification.ts <type> <email>
 *
 * `type` is one of the keys below, `email` names the recipient. The bell moves
 * ONLY via the pubsub -> SSE path (a separate process), so a moving badge
 * proves the real-time channel end to end.
 *
 * To see preferences working, turn a topic off at
 * /admin/notification-preferences and re-run: `comment` and `like` stop
 * arriving, while `security` still does — it belongs to no topic at all.
 */

/**
 * The notifications this script can send, by CLI argument.
 *
 * Each carries its own `send` rather than a shared `(type, params)` pair: a
 * batched type takes `input` and a plain one takes `params`, and the whole point
 * of the two constructors is that those are not interchangeable.
 *
 * `postId` is a real seeded post rather than a fixed uuid: the batched like type
 * reads the like table, so a post that does not exist makes it throw.
 */
const SCENARIOS: Record<
  string,
  {
    description: string;
    send: (
      notification: NotificationService,
      recipientId: string,
      postId: string,
    ) => Promise<{ requestId: string | null }>;
  }
> = {
  text: {
    description: 'Plain text via notifyText (generic type, topic "general")',
    send: (notification, recipientId) =>
      notification.notifyText(recipientId, 'Test notification 👋', {
        actionUrl: '/admin/accounts/users',
      }),
  },
  comment: {
    description:
      'post.commented — topic "postComments", in-app + email. Carries an excerpt, so it exercises the body line',
    send: (notification, recipientId, postId) =>
      notification.notify(POST_COMMENTED_TYPE, {
        recipientId,
        params: {
          postId,
          postTitle: 'Hello world',
          commenterName: 'Ada Lovelace',
          excerpt:
            'This is exactly what I needed — one question about the second paragraph though.',
        },
      }),
  },
  like: {
    description:
      'post.liked — topic "postLikes" (email defaults to a digest). Batched: params come from the like table',
    send: (notification, recipientId, postId) =>
      notification.notify(POST_LIKED_TYPE, {
        recipientId,
        input: { postId },
      }),
  },
  security: {
    description:
      'account.securityAlert — topic-less, so it ignores preferences entirely',
    send: (notification, recipientId) =>
      notification.notify(SECURITY_ALERT_TYPE, {
        recipientId,
        params: { action: 'New sign-in', ipAddress: '203.0.113.4' },
      }),
  },
};

function usage(): string {
  const rows = Object.entries(SCENARIOS)
    .map(([key, { description }]) => `  ${key.padEnd(9)} ${description}`)
    .join('\n');
  return `Usage: pnpm script:run src/scripts/send-test-notification.ts <type> <email>\n\nTypes:\n${rows}`;
}

async function main(): Promise<void> {
  const [scenarioArg, emailArg] = process.argv.slice(2);
  if (!scenarioArg) {
    throw new Error(`A notification type is required.\n\n${usage()}`);
  }
  const scenario = SCENARIOS[scenarioArg];
  if (!scenario) {
    throw new Error(
      `Unknown notification type "${scenarioArg}".\n\n${usage()}`,
    );
  }

  // Named rather than defaulted to the first user: this notifies a real
  // account you are signed in as, so guessing the recipient would send someone
  // else's test mail.
  if (!emailArg) {
    throw new Error(`A recipient email is required.\n\n${usage()}`);
  }

  const recipient = await prisma.user.findUnique({
    where: { email: emailArg },
  });

  if (!recipient) {
    throw new Error(`No user found with email "${emailArg}"`);
  }

  // Found-or-created, so the post-shaped scenarios point at something real
  // rather than a fixed uuid the batched like type would fail to read.
  const postId = await seedDemoPost(recipient.id);

  // The default runtime is enough to WRITE: `renderForWrite` takes the type as
  // an argument, so the frozen snapshot does not go through the registry. The
  // registry only matters when reading rows back, which the app does with its
  // own runtime.
  const { requestId } = await withScriptContext((context) =>
    scenario.send(context.services.notification, recipient.id, postId),
  );

  // A null request is not a failure: a collapsing type whose recomputed state
  // matches what is stored is deliberately absorbed, so say so rather than
  // printing "null" and looking broken.
  if (requestId === null) {
    console.info(
      `No change for ${scenarioArg}: the stored notification already says this, so nothing was written.`,
    );
    return;
  }

  console.info(
    `Queued ${scenarioArg} notification ${requestId} for ${recipient.email} (${recipient.id})`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    // withScriptContext's runtime.dispose() quits the pubsub Redis connections gracefully
    // (draining in-flight commands), so the PUBLISH is flushed before this
    // resolves.
    await prisma.$disconnect();
    process.exit();
  });
