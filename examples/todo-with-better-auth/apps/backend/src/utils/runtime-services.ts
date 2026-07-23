import type { Auth } from '@src/modules/accounts/auth/services/auth.js';
import type { UserSessionService } from '@src/modules/accounts/auth/types/user-session.types.js';
import type { QueueService } from '@src/types/queue.types.js';

/**
 * Services constructed by {@link createAppRuntime} and delivered on
 * {@link ServiceContext.services}. Deep-readonly: fields, not just the bag.
 */
export interface RuntimeServices {
  readonly queues: QueueService;
  readonly betterAuth: Auth;
  readonly userSession: UserSessionService;
}
