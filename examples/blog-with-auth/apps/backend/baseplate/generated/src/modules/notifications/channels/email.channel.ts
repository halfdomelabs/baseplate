import type { EmailComponent } from '@blog-with-auth/transactional';

import {
  NotificationDigestEmail,
  NotificationEmail,
} from '@blog-with-auth/transactional';

import { logError } from '@src/services/error-logger.js';

import type { EmailService } from '../../emails/services/email.service.js';
import type { RenderContext } from '../services/notification-content.js';
import type {
  NotificationRenderer,
  RenderSource,
} from '../services/notification-renderer.js';
import type { NotificationChannel } from './types.js';

import { segmentsToText } from '../services/notification-content.js';

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
  readonly component: /* TPL_EMAIL_COMPONENT:START */ EmailComponent/* TPL_EMAIL_COMPONENT:END */ <any>;
  readonly data: unknown;
  /** Overrides the component's own subject when present. */
  readonly subject?: string;
}

/**
 * One entry in the digest email, taken from the template's own props so the
 * two cannot drift as its layout evolves.
 */
type DigestItem = NonNullable<
  typeof /* TPL_NOTIFICATION_DIGEST_EMAIL:START */ NotificationDigestEmail /* TPL_NOTIFICATION_DIGEST_EMAIL:END */.PreviewProps
>['items'][number];

/**
 * Pairs an email component with its props, checked here and erased for storage.
 *
 * `P` is inferred from the component, so a missing or misspelled prop is a
 * compile error at the call site even though the stored shape is untyped.
 */
export function notificationEmail<P extends object>(
  component: /* TPL_EMAIL_COMPONENT:START */ EmailComponent/* TPL_EMAIL_COMPONENT:END */ <P>,
  data: P,
  options?: { subject?: string },
): NotificationEmailContent {
  return { component, data, subject: options?.subject };
}

/** Default render locale until i18n lands, matching the generic renderer. */
const DEFAULT_LOCALE = 'en';

/**
 * A row's bespoke email, or null to fall back to the generic wrapper.
 *
 * Lives here rather than on the renderer because everything channel-specific
 * about it is: which renderer to invoke, what its output means, and that a
 * failure is not fatal. The renderer supplies only the channel-neutral half —
 * resolving a row to its type and parsed params.
 *
 * Null covers every way an override can be unavailable — none declared, the
 * renderer retired, params drifted, or the override threw — because they all
 * mean the same thing to the caller: send the generic email. A broken custom
 * template must never mean no email at all.
 */
function renderCustomEmail(
  renderer: NotificationRenderer,
  row: RenderSource,
  ctx?: RenderContext,
): NotificationEmailContent | null {
  const resolved = renderer.resolveParams(row);
  if (!resolved?.type.renderers?.email) return null;

  try {
    // Called through its object rather than as a bare reference, so a renderer
    // written as a method still sees its own `this`.
    return resolved.type.renderers.email(
      resolved.params,
      ctx ?? { locale: DEFAULT_LOCALE },
    );
  } catch (error) {
    logError(error, {
      source: 'notification-render-email',
      reason: 'render-threw',
      notificationId: row.id,
      type: `${row.type}@${row.templateVersion}`,
    });
    return null;
  }
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
      const custom = renderCustomEmail(renderer, notification);
      if (custom) {
        await email.send(custom.component, {
          to: recipient.email,
          data: custom.data,
          // The key is omitted rather than passed as undefined: `send` spreads
          // these options over the rendered subject, and a present-but-undefined
          // `subject` would overwrite the component's own with nothing.
          ...(custom.subject === undefined ? {} : { subject: custom.subject }),
        });
        return;
      }

      const content = renderer.renderContent(notification);

      await email.send(
        /* TPL_NOTIFICATION_EMAIL:START */ NotificationEmail /* TPL_NOTIFICATION_EMAIL:END */,
        {
          to: recipient.email,
          data: {
            subject: segmentsToText(content.title),
            title: content.title,
            body: content.body ?? undefined,
            actionUrl: content.actionUrl ?? undefined,
          },
        },
      );
    },
    deliverDigest: async ({ notifications, recipient }) => {
      if (!recipient.email) return;

      // Deliberately renders through `render` rather than the type's own email
      // override: a bespoke template commits to being a whole email — its own
      // subject, layout and action — so it cannot be a list item, and honouring
      // it here would mean handing back several emails for the one the
      // recipient asked for. `render` is required and channel-neutral, so a
      // digestable representation always exists.
      const items: DigestItem[] = notifications.map((notification) => {
        const content = renderer.renderContent(notification);
        return {
          title: content.title,
          body: content.body ?? undefined,
          actionUrl: content.actionUrl ?? undefined,
        };
      });

      await email.send(
        /* TPL_NOTIFICATION_DIGEST_EMAIL:START */ NotificationDigestEmail /* TPL_NOTIFICATION_DIGEST_EMAIL:END */,
        {
          to: recipient.email,
          data: { items },
        },
      );
    },
  };
}
