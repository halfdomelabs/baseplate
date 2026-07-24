import Stripe from 'stripe';

import type { RedisRuntime } from '../services/redis.js';
import type { QueueRuntime } from '../types/queue.types.js';
import type { AppServices } from './runtime-services.js';

import { buildAuth } from '../modules/accounts/auth/services/auth.js';
import { createBetterAuthUserSessionService } from '../modules/accounts/auth/services/user-session.service.js';
import {
  createEmailService,
  createEmailTransport,
} from '../modules/emails/services/emails.service.js';
import { postmarkEmailAdapter } from '../modules/emails/services/postmark.service.js';
import { rootModule } from '../modules/index.js';
import { createStorageService } from '../modules/storage/services/storage.service.js';
import { createQueueRuntime } from '../services/bullmq.service.js';
import { config } from '../services/config.js';
import { createRedisRuntime } from '../services/redis.js';
import { flattenAppModule } from './app-modules.js';

/**
 * Composition root for shared services. Constructs everything stateful and
 * owns disposal; nothing outside this file imports the assembled runtime.
 *
 * Construction must not connect or do I/O - allocate passive clients or
 * connect lazily (e.g. ioredis `lazyConnect`). This keeps construction cheap
 * enough for every execution path, including prisma-only seeds, to afford a
 * full service context.
 */
export interface AppRuntime {
  readonly services: Readonly<AppServices>;
  /* TPL_RUNTIME_FIELDS:START */
  queues: QueueRuntime;
  /** Runtime-internal: connection lifecycle, not for feature code. */
  redis: RedisRuntime;
  /* TPL_RUNTIME_FIELDS:END */
  /**
   * Disposes every constructed service in reverse construction order.
   * Idempotent. Attempts every disposer even if one fails, then throws an
   * AggregateError if any failed.
   */
  dispose(): Promise<void>;
}

export function createAppRuntime(/* TPL_OPTIONS_PARAM:INLINE */): AppRuntime {
  const disposers: { name: string; dispose: () => Promise<void> }[] = [];
  let disposePromise: Promise<void> | undefined;

  /* TPL_SERVICE_CONSTRUCTION:START */
  const redis = createRedisRuntime();
  disposers.push({ name: 'redis', dispose: () => redis.dispose() });

  const { queues: queueBindings = [], storageCategories = [] } =
    flattenAppModule(rootModule);
  const queues = createQueueRuntime(queueBindings);
  disposers.push({ name: 'queues', dispose: () => queues.stopWorkers() });

  const emails = createEmailService({ queues });
  const emailTransport = createEmailTransport(postmarkEmailAdapter);

  const betterAuth = buildAuth({ emails });
  const userSession = createBetterAuthUserSessionService(betterAuth);

  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

  const storage = createStorageService(storageCategories);
  /* TPL_SERVICE_CONSTRUCTION:END */

  const services: AppServices = /* TPL_SERVICES_OBJECT:START */ {
    betterAuth,
    emails,
    emailTransport,
    queues,
    storage,
    stripe,
    userSession,
  }; /* TPL_SERVICES_OBJECT:END */

  async function disposeOnce(): Promise<void> {
    const errors: unknown[] = [];
    for (const { dispose: disposeOne } of disposers.toReversed()) {
      try {
        await disposeOne();
      } catch (error: unknown) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Failed to dispose app runtime');
    }
  }

  function dispose(): Promise<void> {
    disposePromise ??= disposeOnce();
    return disposePromise;
  }

  const runtime = /* TPL_RUNTIME_FIELD_VALUES:START */ {
    queues,
    redis,
  }; /* TPL_RUNTIME_FIELD_VALUES:END */

  return { ...runtime, services, dispose };
}
