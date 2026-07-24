import type Stripe from 'stripe';

import type { Auth } from '../modules/accounts/auth/services/auth.js';
import type { UserSessionService } from '../modules/accounts/auth/types/user-session.types.js';
import type { EmailTransport } from '../modules/emails/emails.types.js';
import type { EmailService } from '../modules/emails/services/emails.service.js';
import type { StorageService } from '../modules/storage/services/storage.service.js';
import type { QueueService } from '../types/queue.types.js';

/**
 * Services constructed by {@link createAppRuntime} and delivered on
 * {@link ServiceContext.services}. Deep-readonly: fields, not just the bag.
 */
export interface AppServices {
  /* TPL_SERVICES_FIELDS:START */
  betterAuth: Auth;
  emails: EmailService;
  emailTransport: EmailTransport;
  queues: QueueService;
  storage: StorageService;
  stripe: Stripe;
  userSession: UserSessionService;
  /* TPL_SERVICES_FIELDS:END */
}
