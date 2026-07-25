import type { CookieUserSessionService } from '../modules/accounts/auth/services/user-session.service.js';
import type { EmailTransport } from '../modules/emails/emails.types.js';
import type { EmailService } from '../modules/emails/services/emails.service.js';
import type { NotificationService } from '../modules/notifications/services/notification.service.js';
import type { QueueService } from '../types/queue.types.js';

/**
 * Services constructed by {@link createAppRuntime} and delivered on
 * {@link ServiceContext.services}. Deep-readonly: fields, not just the bag.
 */
export interface AppServices {
  /* TPL_SERVICES_FIELDS:START */
  emails: EmailService;
  emailTransport: EmailTransport;
  notifications: NotificationService;
  queues: QueueService;
  userSession: CookieUserSessionService;
  /* TPL_SERVICES_FIELDS:END */
}
