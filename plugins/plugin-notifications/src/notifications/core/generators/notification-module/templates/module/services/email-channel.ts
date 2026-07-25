// @ts-nocheck

import type { NotificationChannel } from '$servicesNotificationChannel';
import type { EmailService } from '%emailModuleImports';

import { prisma } from '%prismaImports';

/**
 * The email channel: renders the already-resolved content into the default
 * notification email and enqueues it via the email service. Delivery-time
 * rendering (not read-time) — the channel receives the frozen `RenderedContent`
 * produced when the notification was created, and `emails.send` renders the
 * React component before the message is queued.
 *
 * The recipient's address is read through the plugin-owned `recipient` relation.
 * A recipient with no email (the field is nullable) is skipped, not an error.
 */
export function createEmailChannel(deps: {
  emails: EmailService;
}): NotificationChannel {
  const { emails } = deps;
  return {
    deliver: async (notification) => {
      const row = await prisma.notification.findUnique({
        where: { id: notification.notificationId },
        select: {
          recipient: { select: { email: true } },
          actor: { select: { name: true } },
        },
      });
      const to = row?.recipient.email;
      if (!to) return;

      await emails.send(TPL_NOTIFICATION_EMAIL, {
        to,
        data: {
          actorName: row.actor?.name ?? undefined,
          segments: notification.segments,
          body: notification.fallbackText,
          actionUrl: notification.actionUrl ?? undefined,
        },
      });
    },
  };
}
