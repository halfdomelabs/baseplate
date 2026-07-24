import type { Auth } from '../modules/accounts/auth/services/auth.js';
import type { UserSessionService } from '../modules/accounts/auth/types/user-session.types.js';
import type { QueueService } from '../types/queue.types.js';

/**
 * Services constructed by {@link createAppRuntime} and delivered on
 * {@link ServiceContext.services}. Deep-readonly: fields, not just the bag.
 */
export interface RuntimeServices {
  /* TPL_SERVICES_FIELDS:START */
  betterAuth: Auth;
  queues: QueueService;
  userSession: UserSessionService;
  /* TPL_SERVICES_FIELDS:END */
}
