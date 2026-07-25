import Stripe from 'stripe';

import type { Auth } from '../modules/accounts/auth/services/auth.js';
import type { UserSessionService } from '../modules/accounts/auth/types/user-session.types.js';
import type { EmailTransport } from '../modules/emails/emails.types.js';
import type { EmailService } from '../modules/emails/services/emails.service.js';
import type { StorageService } from '../modules/storage/services/storage.service.js';
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
export interface AppRuntime<
  TServices extends Partial<AppServices> = AppServices,
> {
  readonly services: Readonly<TServices>;
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

/**
 * Runtime objects that may be supplied instead of constructed, keyed by the
 * concrete object each one replaces. A superset of {@link AppServices}: it
 * also covers runtime-internal objects like `redis` that feature code never
 * sees.
 *
 * Where a service is exposed through a narrowed view (`services.queues` is a
 * `QueueService`), the override is typed as the full underlying object, since
 * both surfaces alias it.
 */
export interface AppRuntimeOverrides {
  /* TPL_OVERRIDE_FIELDS:START */
  betterAuth: Auth;
  emails: EmailService;
  emailTransport: EmailTransport;
  queues: QueueRuntime;
  redis: RedisRuntime;
  storage: StorageService;
  stripe: Stripe;
  userSession: UserSessionService;
  /* TPL_OVERRIDE_FIELDS:END */
}

export function createAppRuntime(
  /* TPL_OPTIONS_PARAM:START */ options: {
    /**
     * Runtime objects to use instead of constructing them. An overridden key's
     * construction is skipped entirely and downstream construction consumes the
     * override. Overrides are borrowed: the runtime never disposes them.
     */
    overrides?: Partial<AppRuntimeOverrides>;
  } = {} /* TPL_OPTIONS_PARAM:END */,
): AppRuntime {
  const disposers: { name: string; dispose: () => Promise<void> }[] = [];
  let disposePromise: Promise<void> | undefined;
  const overrides = options.overrides ?? {};

  /**
   * Returns the runtime object for `key`: the supplied override if there is
   * one, otherwise the constructed value.
   *
   * An override skips construction entirely and is borrowed - only a value
   * this function constructs registers a disposer, so the runtime never
   * disposes what a caller owns.
   *
   * @param key The runtime object being provided.
   * @param create Builds the object when it is not overridden.
   * @param dispose Releases a constructed object, if it holds resources.
   * @returns The override or the newly constructed object.
   */
  function provide<K extends keyof AppRuntimeOverrides>(
    key: K,
    create: () => AppRuntimeOverrides[K],
    dispose?: (value: AppRuntimeOverrides[K]) => Promise<void>,
  ): AppRuntimeOverrides[K] {
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

  /* TPL_SERVICE_CONSTRUCTION:START */
  const { queues: queueBindings = [], storageCategories = [] } =
    flattenAppModule(rootModule);

  const redis = provide('redis', createRedisRuntime, (redis) =>
    redis.dispose(),
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

  return {
    services,
    /* TPL_RUNTIME_FIELD_VALUES:START */
    queues,
    redis,
    /* TPL_RUNTIME_FIELD_VALUES:END */
    dispose,
  };
}
