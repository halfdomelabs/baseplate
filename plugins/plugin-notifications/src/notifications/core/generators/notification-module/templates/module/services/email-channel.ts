// @ts-nocheck

import type { NotificationChannel } from '$servicesNotificationChannel';
import type { NotificationRenderer } from '$servicesNotificationRenderer';
import type { EmailService } from '%emailModuleImports';

/**
 * The email channel: renders at delivery time — not from a frozen snapshot —
 * so a copy fix reaches mail that has not gone out yet, and sends one message
 * per recipient. A recipient with no email is skipped.
 */
export function createEmailChannel(deps: {
  email: EmailService;
  renderer: NotificationRenderer;
}): NotificationChannel {
  const { email, renderer } = deps;
  return {
    deliver: async ({ notifications, recipient, actor }) => {
      const [first] = notifications;
      if (!first || !recipient.email) return;

      const content = renderer.renderContent(first);

      await email.send(TPL_NOTIFICATION_EMAIL, {
        to: recipient.email,
        data: {
          actorName: actor?.name ?? undefined,
          segments: content.segments,
          body: content.fallbackText,
          actionUrl: content.actionUrl ?? undefined,
        },
      });
    },
  };
}
