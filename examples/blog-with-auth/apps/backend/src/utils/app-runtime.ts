import type { PubSub } from 'graphql-yoga';

import type { PubSubPublishArgs } from '../plugins/graphql/pubsub.js';
import type { QueueRuntime } from '../types/queue.types.js';
import type { AppServices } from './runtime-services.js';

import { CookieUserSessionService } from '../modules/accounts/auth/services/user-session.service.js';
import { rootModule } from '../modules/index.js';
import { createNotificationEvents } from '../modules/notifications/services/notification-events.js';
import { createNotificationService } from '../modules/notifications/services/notification.service.js';
import { createGraphqlPubSub } from '../plugins/graphql/pubsub.js';
import { createQueueRuntime } from '../services/pg-boss.service.js';
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
  pubsub: PubSub<PubSubPublishArgs>;
  queues: QueueRuntime;
  /* TPL_RUNTIME_FIELDS:END */
  /**
   * Disposes every constructed service in reverse construction order.
   * Idempotent. Attempts every disposer even if one fails, then throws an
   * AggregateError if any failed.
   */
  dispose(): Promise<void>;
}

export function createAppRuntime(
  /* TPL_OPTIONS_PARAM:START */ options: {
    disableQueueMaintenance?: boolean;
  } = {} /* TPL_OPTIONS_PARAM:END */,
): AppRuntime {
  const disposers: { name: string; dispose: () => Promise<void> }[] = [];
  let disposePromise: Promise<void> | undefined;

  /* TPL_SERVICE_CONSTRUCTION:START */
  const redis = createRedisRuntime();
  disposers.push({ name: 'redis', dispose: () => redis.dispose() });

  const pubsub = createGraphqlPubSub(redis);

  const notifications = createNotificationService({
    events: createNotificationEvents(pubsub),
  });

  const { queues: queueBindings = [] } = flattenAppModule(rootModule);
  const queues = createQueueRuntime(queueBindings, {
    disableMaintenance: options.disableQueueMaintenance,
  });
  disposers.push({ name: 'queues', dispose: () => queues.stopWorkers() });

  const userSession = new CookieUserSessionService();
  /* TPL_SERVICE_CONSTRUCTION:END */

  const services: AppServices = /* TPL_SERVICES_OBJECT:START */ {
    notifications,
    queues,
    redis,
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
    pubsub,
    queues,
  }; /* TPL_RUNTIME_FIELD_VALUES:END */

  return { ...runtime, services, dispose };
}
