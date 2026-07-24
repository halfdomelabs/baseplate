#!/usr/bin/env node
import { prisma } from '@src/services/prisma.js';

import { notifyText } from '../modules/notifications/services/notification.service.js';

/**
 * Dev helper: fire a notification at a user so you can watch the admin bell
 * update live over SSE. Run it in the same env as the dev server so it publishes
 * to the same Redis the server subscribes to:
 *
 *   pnpm script:run src/scripts/send-test-notification.ts [email] [text]
 *
 * With no email it targets the first user; with no text it uses a default. The
 * bell moves ONLY via the pubsub -> SSE path (separate process), so a moving
 * badge proves the real-time channel end to end.
 */
async function main(): Promise<void> {
  const [emailArg, ...textParts] = process.argv.slice(2);
  const text = textParts.join(' ') || 'Test notification 👋';

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

  const notification = await notifyText(recipient.id, text, {
    actionUrl: '/admin/accounts/users',
  });

  console.info(
    `Sent notification ${notification.id} to ${recipient.email} (${recipient.id})`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    // The Redis pubsub clients (owned internally by getPubSub) keep the event
    // loop alive, so the process would otherwise hang. Give the fire-and-forget
    // PUBLISH a tick to flush to the wire, disconnect Prisma, then force-exit.
    await new Promise((resolve) => setTimeout(resolve, 250));
    await prisma.$disconnect();
    process.exit();
  });
