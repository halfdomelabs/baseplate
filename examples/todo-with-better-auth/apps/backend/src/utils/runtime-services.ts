import type Stripe from 'stripe';

import type { Auth } from '../modules/accounts/auth/services/auth.js';
import type { UserSessionService } from '../modules/accounts/auth/types/user-session.types.js';
import type { BillingService } from '../modules/billing/services/billing.service.js';
import type { EmailTransport } from '../modules/emails/email.types.js';
import type { EmailService } from '../modules/emails/services/email.service.js';
import type { StorageService } from '../modules/storage/services/storage.service.js';
import type { RedisRuntime } from '../services/redis.js';
import type { QueueRuntime } from '../types/queue.types.js';

/**
 * The public service API, delivered on `ServiceContext.services`. Fields are
 * `readonly`, so the modifier survives `Pick<AppServices, K>` at every
 * narrowing site.
 */
export interface AppServices {
  /* TPL_SERVICES_FIELDS:START */
  readonly betterAuth: Auth;
  readonly billing: BillingService;
  readonly email: EmailService;
  readonly queue: QueueRuntime;
  readonly redis: RedisRuntime;
  readonly storage: StorageService;
  readonly stripe: Stripe;
  readonly userSession: UserSessionService;
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
  /* TPL_INTERNAL_SERVICES_FIELDS:END */
}

/** Every service the runtime constructs, held by `AppRuntime.services`. */
export type RuntimeServices = AppServices & InternalServices;
