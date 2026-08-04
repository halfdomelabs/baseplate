#!/usr/bin/env node
import type { NotificationService } from '@src/modules/notifications/services/notification.service.js';

import {
  POST_COMMENTED_TYPE,
  POST_LIKED_TYPE,
  SECURITY_ALERT_TYPE,
} from '@src/modules/blogs/notifications/blog-notification-types.js';
import { prisma } from '@src/services/prisma.js';

import { withScriptContext } from '../utils/service-context.js';

/**
 * Dev helper: fire a notification at a user so you can watch the admin bell
 * update live over SSE, and see notification preferences take effect. Run it in
 * the same env as the dev server so it publishes to the same Redis the server
 * subscribes to:
 *
 *   pnpm script:run src/scripts/send-test-notification.ts [type] [email]
 *
 * `type` is one of the keys below (default `text`); with no email it targets the
 * first user. The bell moves ONLY via the pubsub -> SSE path (a separate
 * process), so a moving badge proves the real-time channel end to end.
 *
 * To see preferences working, turn a topic off at
 * /admin/notification-preferences and re-run: `comment` and `like` stop
 * arriving, while `security` still does — it belongs to no topic at all.
 */

const SAMPLE_POST_ID = '00000000-0000-0000-0000-000000000000';

/**
 * The notifications this script can send, by CLI argument.
 *
 * Each carries its own `send` rather than a shared `(type, params)` pair: a
 * batched type takes `input` and a plain one takes `params`, and the whole point
 * of the two constructors is that those are not interchangeable.
 */
const SCENARIOS: Record<
  string,
  {
    description: string;
    send: (
      notification: NotificationService,
      recipientId: string,
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
    description: 'post.commented — topic "general", in-app + email',
    send: (notification, recipientId) =>
      notification.notify(POST_COMMENTED_TYPE, {
        recipientId,
        actorLabel: 'Test Script',
        params: {
          postId: SAMPLE_POST_ID,
          postTitle: 'Hello world',
          commenterName: 'Ada Lovelace',
        },
      }),
  },
  like: {
    description:
      'post.liked — topic "general", in-app only. Batched: params come from the like table, so this needs a real post id',
    send: (notification, recipientId) =>
      notification.notify(POST_LIKED_TYPE, {
        recipientId,
        actorLabel: 'Test Script',
        input: { postId: SAMPLE_POST_ID },
      }),
  },
  security: {
    description:
      'account.securityAlert — topic-less, so it ignores preferences entirely',
    send: (notification, recipientId) =>
      notification.notify(SECURITY_ALERT_TYPE, {
        recipientId,
        actorLabel: 'Test Script',
        params: { action: 'New sign-in', ipAddress: '203.0.113.4' },
      }),
  },
};

function usage(): string {
  const rows = Object.entries(SCENARIOS)
    .map(([key, { description }]) => `  ${key.padEnd(9)} ${description}`)
    .join('\n');
  return `Usage: pnpm script:run src/scripts/send-test-notification.ts [type] [email]\n\nTypes:\n${rows}`;
}

async function main(): Promise<void> {
  const [scenarioArg = 'text', emailArg] = process.argv.slice(2);
  const scenario = SCENARIOS[scenarioArg];
  if (!scenario) {
    throw new Error(
      `Unknown notification type "${scenarioArg}".\n\n${usage()}`,
    );
  }

  const recipient = emailArg
    ? await prisma.user.findUnique({ where: { email: emailArg } })
    : await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });

  if (!recipient) {
    throw new Error(
      emailArg
        ? `No user found with email "${emailArg}"`
        : 'No users exist to notify',
    );
  }

  // The default runtime is enough to WRITE: `renderForWrite` takes the type as
  // an argument, so the frozen snapshot does not go through the registry. The
  // registry only matters when reading rows back, which the app does with its
  // own runtime.
  const { requestId } = await withScriptContext((context) =>
    scenario.send(context.services.notification, recipient.id),
  );

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
