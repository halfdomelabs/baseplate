import type { PubSub } from 'graphql-yoga';

import type { CookieUserSessionService } from '../modules/accounts/auth/services/user-session.service.js';
import type { EmailTransport } from '../modules/emails/email.types.js';
import type { EmailService } from '../modules/emails/services/email.service.js';
import type { NotificationEvents } from '../modules/notifications/services/notification-events.js';
import type { NotificationOutbox } from '../modules/notifications/services/notification-outbox.js';
import type { NotificationRenderer } from '../modules/notifications/services/notification-renderer.js';
import type { NotificationService } from '../modules/notifications/services/notification.service.js';
import type { PubSubPublishArgs } from '../plugins/graphql/pubsub.js';
import type { RedisRuntime } from '../services/redis.js';
import type { QueueRuntime } from '../types/queue.types.js';

/**
 * Services constructed by {@link createAppRuntime} and delivered on
 * {@link ServiceContext.services}. Fields are `readonly`, so the modifier
 * survives `Pick<AppServices, K>` at every narrowing site.
 */
export interface AppServices {
  /* TPL_SERVICES_FIELDS:START */
  readonly email: EmailService;
  readonly emailTransport: EmailTransport;
  readonly notification: NotificationService;
  readonly notificationEvents: NotificationEvents;
  readonly notificationOutbox: NotificationOutbox;
  readonly notificationRenderer: NotificationRenderer;
  readonly pubsub: PubSub<PubSubPublishArgs>;
  readonly queue: QueueRuntime;
  readonly redis: RedisRuntime;
  readonly userSession: CookieUserSessionService;
  /* TPL_SERVICES_FIELDS:END */
}
