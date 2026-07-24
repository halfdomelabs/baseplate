import type { CookieUserSessionService } from '../modules/accounts/auth/services/user-session.service.js';
import type { QueueService } from '../types/queue.types.js';

/**
 * Services constructed by {@link createAppRuntime} and delivered on
 * {@link ServiceContext.services}. Deep-readonly: fields, not just the bag.
 */
export interface RuntimeServices {
  /* TPL_SERVICES_FIELDS:START */
  queues: QueueService;
  userSession: CookieUserSessionService;
  /* TPL_SERVICES_FIELDS:END */
}
