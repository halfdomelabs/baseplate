import Stripe from 'stripe';

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
 * Owns the application's service graph and its aggregate disposal. Not a
 * second dependency registry - every application-scoped dependency lives on
 * {@link AppServices}, and consumers narrow with `ServiceContextWith<K>` to
 * declare the subset they use.
 *
 * Construction must not connect or do I/O - allocate passive clients or
 * connect lazily (e.g. ioredis `lazyConnect`). This keeps construction cheap
 * enough for every execution path, including prisma-only seeds, to afford a
 * full service context.
 *
 * Always complete: overriding a service replaces what gets constructed, not
 * which services exist. Consumers that want an honest signature narrow the
 * services bag itself - a webhook plugin declares
 * `{ services: Pick<AppServices, 'stripe'> }` rather than taking the runtime.
 *
 * `dispose` lives here rather than on {@link AppServices} because request
 * contexts receive the services bag and must never be able to dispose the
 * application.
 */
export interface AppRuntime {
  readonly services: AppServices;
  /**
   * Disposes every constructed service in reverse construction order.
   * Idempotent. Attempts every disposer even if one fails, then throws an
   * AggregateError if any failed.
   */
  dispose(): Promise<void>;
}

export function createAppRuntime(
  /* TPL_OPTIONS_PARAM:START */ options: {
    /**
     * Services to use instead of constructing them. An overridden key's
     * construction is skipped entirely and downstream construction consumes the
     * override. Overrides are borrowed: the runtime never disposes them.
     */
    overrides?: Partial<AppServices>;
  } = {} /* TPL_OPTIONS_PARAM:END */,
): AppRuntime {
  const disposers: { name: string; dispose: () => Promise<void> }[] = [];
  let disposePromise: Promise<void> | undefined;

  /* TPL_PROVIDE_HELPER:START */
  const overrides = options.overrides ?? {};

  /**
   * Returns the service for `key`: the supplied override if there is one,
   * otherwise the constructed value.
   *
   * An override skips construction entirely and is borrowed - only a value
   * this function constructs registers a disposer, so the runtime never
   * disposes what a caller owns.
   *
   * @param key The service being provided.
   * @param create Builds the object when it is not overridden.
   * @param dispose Releases a constructed object, if it holds resources.
   * @returns The override or the newly constructed object.
   */
  function provide<K extends keyof AppServices>(
    key: K,
    create: () => AppServices[K],
    dispose?: (value: AppServices[K]) => Promise<void>,
  ): AppServices[K] {
    const overridden = overrides[key];
    if (overridden !== undefined) {
      return overridden;
    }

    const value = create();
    if (dispose) {
      disposers.push({ name: key, dispose: () => dispose(value) });
    }
    return value;
  }
  /* TPL_PROVIDE_HELPER:END */

  /* TPL_SERVICE_CONSTRUCTION:START */
  const { queues: queueBindings = [], storageCategories = [] } =
    flattenAppModule(rootModule);

  const redis = provide(
    'redis',
    () => createRedisRuntime(),
    (redis) => redis.dispose(),
  );

  const emailTransport = provide('emailTransport', () =>
    createEmailTransport(postmarkEmailAdapter),
  );

  const queues = provide(
    'queues',
    () => createQueueRuntime(queueBindings, redis),
    (queues) => queues.stopWorkers(),
  );

  const emails = provide('emails', () => createEmailService({ queues }));

  const betterAuth = provide('betterAuth', () => buildAuth({ emails }));

  const storage = provide('storage', () =>
    createStorageService(storageCategories),
  );

  const stripe = provide('stripe', () => new Stripe(config.STRIPE_SECRET_KEY));

  const userSession = provide('userSession', () =>
    createBetterAuthUserSessionService(betterAuth),
  );
  /* TPL_SERVICE_CONSTRUCTION:END */

  const services = /* TPL_SERVICES_OBJECT:START */ {
    betterAuth,
    emails,
    emailTransport,
    queues,
    redis,
    storage,
    stripe,
    userSession,
  } /* TPL_SERVICES_OBJECT:END */ satisfies AppServices;

  async function disposeOnce(): Promise<void> {
    const errors: unknown[] = [];
    for (const { name, dispose: disposeOne } of disposers.toReversed()) {
      try {
        await disposeOne();
      } catch (error: unknown) {
        errors.push(new Error(`Failed to dispose ${name}`, { cause: error }));
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

  return { services, dispose };
}
