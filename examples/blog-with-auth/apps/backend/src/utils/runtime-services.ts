import type { CookieUserSessionService } from '../modules/accounts/auth/services/user-session.service.js';
import type { EmailTransport } from '../modules/emails/email.types.js';
import type { EmailService } from '../modules/emails/services/email.service.js';
import type { NotificationOutbox } from '../modules/notifications/services/notification-outbox.js';
import type { NotificationService } from '../modules/notifications/services/notification.service.js';
import type { RedisRuntime } from '../services/redis.js';
import type { QueueRuntime } from '../types/queue.types.js';

/**
 * The public service API, delivered on `ServiceContext.services`. Fields are
 * `readonly`, so the modifier survives `Pick<AppServices, K>` at every
 * narrowing site.
 */
export interface AppServices {
  /* TPL_SERVICES_FIELDS:START */
  readonly email: EmailService;
  readonly notification: NotificationService;
  readonly queue: QueueRuntime;
  readonly redis: RedisRuntime;
  readonly userSession: CookieUserSessionService;
  /* TPL_SERVICES_FIELDS:END */
}

/**
 * Services consumed only by machinery - workers and scripts - and never by a
 * request-scoped context. Reached by naming the key in
 * `SystemServiceContextWith`. A service belongs here only once something
 * consumes it through a context; anything used purely to construct another
 * service is injected at its construction site instead.
 */
export interface InternalServices {
  /* TPL_INTERNAL_SERVICES_FIELDS:START */
  readonly emailTransport: EmailTransport;
  readonly notificationOutbox: NotificationOutbox;
  /* TPL_INTERNAL_SERVICES_FIELDS:END */
}

/** Every service the runtime constructs, held by `AppRuntime.services`. */
export type RuntimeServices = AppServices & InternalServices;
