#!/usr/bin/env node
import type { NotificationTypeDefinition } from '@src/modules/notifications/services/notification-registry.js';

import { BLOG_NOTIFICATION_TYPES } from '@src/modules/blogs/notifications/blog-notification-types.js';
import { createNotificationRenderer } from '@src/modules/notifications/services/notification-renderer.js';
import { prisma } from '@src/services/prisma.js';

import { createAppRuntime } from '../utils/app-runtime.js';
import { createSystemServiceContext } from '../utils/service-context.js';

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
 * To see preferences working, turn a category off at
 * /admin/notification-preferences and re-run: `comment` and `like` stop
 * arriving, while `security` still does — its category is mandatory.
 */

const [POST_COMMENTED_TYPE, POST_LIKED_TYPE, SECURITY_ALERT_TYPE] =
  BLOG_NOTIFICATION_TYPES;

/** The notifications this script can send, by CLI argument. */
const SCENARIOS: Record<
  string,
  {
    description: string;
    type?: NotificationTypeDefinition;
    params?: Record<string, unknown>;
  }
> = {
  text: {
    description: 'Plain text via notifyText (generic type, category "general")',
  },
  comment: {
    description: 'post.commented — category "general", in-app + email',
    type: POST_COMMENTED_TYPE,
    params: {
      postId: '00000000-0000-0000-0000-000000000000',
      postTitle: 'Hello world',
      commenterName: 'Ada Lovelace',
    },
  },
  like: {
    description: 'post.liked — category "general", in-app only',
    type: POST_LIKED_TYPE,
    params: {
      postId: '00000000-0000-0000-0000-000000000000',
      postTitle: 'Hello world',
      likerName: 'Grace Hopper',
    },
  },
  security: {
    description:
      'account.securityAlert — category "security" (mandatory: ignores preferences)',
    type: SECURITY_ALERT_TYPE,
    params: { action: 'New sign-in', ipAddress: '203.0.113.4' },
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

  // The example types are not registered on a module (module contents are
  // generated), so the renderer is overridden here with the example types —
  // enough for a script that only writes notifications.
  const runtime = createAppRuntime({
    overrides: {
      notificationRenderer: createNotificationRenderer({
        notificationTypes: BLOG_NOTIFICATION_TYPES,
      }),
    },
  });

  try {
    const context = createSystemServiceContext(runtime.services);
    const { requestId } = scenario.type
      ? await context.services.notification.notify(scenario.type, {
          recipientId: recipient.id,
          params: scenario.params ?? {},
          actorLabel: 'Test Script',
        })
      : await context.services.notification.notifyText(
          recipient.id,
          'Test notification 👋',
          { actionUrl: '/admin/accounts/users' },
        );

    console.info(
      `Queued ${scenarioArg} notification ${requestId} for ${recipient.email} (${recipient.id})`,
    );
  } finally {
    await runtime.dispose();
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    // runtime.dispose() quits the pubsub Redis connections gracefully
    // (draining in-flight commands), so the PUBLISH is flushed before this
    // resolves.
    await prisma.$disconnect();
    process.exit();
  });
