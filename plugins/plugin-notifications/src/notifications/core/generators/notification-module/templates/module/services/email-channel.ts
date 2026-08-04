// @ts-nocheck

import type { NotificationChannel } from '$servicesNotificationChannel';
import type { NotificationRenderer } from '$servicesNotificationRenderer';
import type { EmailService } from '%emailModuleImports';

import { segmentsToText } from '$servicesNotificationContent';

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
    deliver: async ({ notification, recipient }) => {
      if (!recipient.email) return;

      const content = renderer.renderContent(notification);

      await email.send(TPL_NOTIFICATION_EMAIL, {
        to: recipient.email,
        data: {
          subject: segmentsToText(content.title),
          title: content.title,
          body: content.body ?? undefined,
          actionUrl: content.actionUrl ?? undefined,
        },
      });
    },
  };
}
