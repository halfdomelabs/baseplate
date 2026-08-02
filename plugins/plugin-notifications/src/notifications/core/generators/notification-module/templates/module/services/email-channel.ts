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
    deliver: async ({ notification, recipient, actor }) => {
      if (!recipient.email) return;

      // Live name where the actor still exists, else the row's snapshot — a
      // rename between notify and delivery therefore reaches mail before it
      // reaches the frozen feed copy.
      const actorName = actor?.name ?? notification.actorLabel ?? undefined;
      const content = renderer.renderContent(
        notification,
        undefined,
        actorName ? { label: actorName } : undefined,
      );

      await email.send(TPL_NOTIFICATION_EMAIL, {
        to: recipient.email,
        data: {
          actorName,
          segments: content.segments,
          body: content.fallbackText,
          actionUrl: content.actionUrl ?? undefined,
        },
      });
    },
  };
}
