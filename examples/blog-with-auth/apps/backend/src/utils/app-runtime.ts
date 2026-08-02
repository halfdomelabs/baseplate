import type { AppServices } from './runtime-services.js';

import { CookieUserSessionService } from '../modules/accounts/auth/services/user-session.service.js';
import {
  createEmailService,
  createEmailTransport,
} from '../modules/emails/services/email.service.js';
import { postmarkEmailAdapter } from '../modules/emails/services/postmark.adapter.js';
import { rootModule } from '../modules/index.js';
import { createEmailChannel } from '../modules/notifications/services/email-channel.js';
import { createNotificationEvents } from '../modules/notifications/services/notification-events.js';
import { createNotificationOutbox } from '../modules/notifications/services/notification-outbox.js';
import { createNotificationRenderer } from '../modules/notifications/services/notification-renderer.js';
import { createNotificationService } from '../modules/notifications/services/notification.service.js';
import { createGraphqlPubSub } from '../plugins/graphql/pubsub.js';
import { createQueueRuntime } from '../services/pg-boss.service.js';
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
     * Whether this process runs the background loops a service owns, e.g.
     * pg-boss supervision and scheduling. Exactly one process should enable
     * them.
     *
     * Defaults to `false`, so scripts and tests stay passive unless they opt
     * in.
     */
    backgroundServices?: boolean;
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
  const { notificationTypes = [], queues: queueBindings = [] } =
    flattenAppModule(rootModule);

  const redis = provide(
    'redis',
    () => createRedisRuntime(),
    (redis) => redis.dispose(),
  );

  const emailTransport = provide('emailTransport', () =>
    createEmailTransport(postmarkEmailAdapter),
  );

  const notificationRenderer = provide('notificationRenderer', () =>
    createNotificationRenderer({ notificationTypes }),
  );

  const pubsub = provide('pubsub', () => createGraphqlPubSub(redis));

  const notificationEvents = provide('notificationEvents', () =>
    createNotificationEvents(pubsub),
  );

  const queue = provide(
    'queue',
    () =>
      createQueueRuntime(queueBindings, {
        disableMaintenance: !options.backgroundServices,
        // Only the worker process benefits from the listener's dedicated
        // connection, and it is what LISTEN/NOTIFY exists to wake.
        useListenNotify: options.backgroundServices,
      }),
    (queue) => queue.stopWorkers(),
  );

  const email = provide('email', () => createEmailService({ queue }));

  const notificationOutbox = provide('notificationOutbox', () =>
    createNotificationOutbox({
      channels: {
        email: createEmailChannel({ email, renderer: notificationRenderer }),
      },
      queue,
    }),
  );

  const notification = provide('notification', () =>
    createNotificationService({
      events: notificationEvents,
      renderer: notificationRenderer,
      outbox: notificationOutbox,
    }),
  );

  const userSession = provide(
    'userSession',
    () => new CookieUserSessionService(),
  );
  /* TPL_SERVICE_CONSTRUCTION:END */

  const services = /* TPL_SERVICES_OBJECT:START */ {
    email,
    emailTransport,
    notification,
    notificationEvents,
    notificationOutbox,
    notificationRenderer,
    pubsub,
    queue,
    redis,
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
