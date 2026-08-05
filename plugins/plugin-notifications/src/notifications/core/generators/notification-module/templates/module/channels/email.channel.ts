// @ts-nocheck

import type { NotificationChannel } from '$channelsTypes';
import type { NotificationRenderer } from '$servicesNotificationRenderer';
import type { EmailService } from '%emailModuleImports';
import type { EmailComponent } from '@blog-with-auth/transactional';

import { segmentsToText } from '$servicesNotificationContent';

/**
 * What an email renderer produces: a component paired with its props.
 *
 * Erased at rest — the props type cannot survive into the registry, which holds
 * every type through one heterogeneous union. Build one with
 * {@link notificationEmail}, which checks the pairing before erasing it.
 */
export interface NotificationEmailContent {
  /**
   * `any` is load-bearing: `EmailComponent<P>` is invariant in `P` (the props
   * appear in both the call signature and `subject`), so no concrete type is a
   * supertype of every component. It is contained here — the props are checked
   * against the component by {@link notificationEmail} before erasure, and the
   * only consumer re-widens it when handing both back to `email.send`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly component: EmailComponent<any>;
  readonly data: unknown;
  /** Overrides the component's own subject when present. */
  readonly subject?: string;
}

/**
 * Pairs an email component with its props, checked here and erased for storage.
 *
 * `P` is inferred from the component, so a missing or misspelled prop is a
 * compile error at the call site even though the stored shape is untyped.
 */
export function notificationEmail<P extends object>(
  component: EmailComponent<P>,
  data: P,
  options?: { subject?: string },
): NotificationEmailContent {
  return { component, data, subject: options?.subject };
}

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

      // A type may supply its own template for this channel. Null means it did
      // not, or its override could not run — either way the generic wrapper
      // below still sends, so a bespoke template failing never drops the email.
      const custom = renderer.renderEmail(notification);
      if (custom) {
        await email.send(custom.component, {
          to: recipient.email,
          data: custom.data,
          // Absent, the component's own `subject` applies: `send` spreads these
          // options over the rendered subject, so this wins only when set.
          subject: custom.subject,
        });
        return;
      }

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
