import type Stripe from 'stripe';

import type { Auth } from '../modules/accounts/auth/services/auth.js';
import type { UserSessionService } from '../modules/accounts/auth/types/user-session.types.js';
import type { BillingService } from '../modules/billing/services/billing.service.js';
import type { EmailTransport } from '../modules/emails/emails.types.js';
import type { EmailService } from '../modules/emails/services/emails.service.js';
import type { StorageService } from '../modules/storage/services/storage.service.js';
import type { RedisRuntime } from '../services/redis.js';
import type { QueueRuntime } from '../types/queue.types.js';

/**
 * Services constructed by {@link createAppRuntime} and delivered on
 * {@link ServiceContext.services}. Fields are `readonly`, so the modifier
 * survives `Pick<AppServices, K>` at every narrowing site.
 */
export interface AppServices {
  /* TPL_SERVICES_FIELDS:START */
  readonly betterAuth: Auth;
  readonly billing: BillingService;
  readonly emails: EmailService;
  readonly emailTransport: EmailTransport;
  readonly queues: QueueRuntime;
  readonly redis: RedisRuntime;
  readonly storage: StorageService;
  readonly stripe: Stripe;
  readonly userSession: UserSessionService;
  /* TPL_SERVICES_FIELDS:END */
}
