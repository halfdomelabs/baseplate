import type { QueueRuntime } from '@src/types/queue.types.js';

import { buildAuth } from '@src/modules/accounts/auth/services/auth.js';
import { createBetterAuthUserSessionService } from '@src/modules/accounts/auth/services/user-session.service.js';
import { rootModule } from '@src/modules/index.js';
import { createQueueRuntime } from '@src/services/bullmq.service.js';

import type { RuntimeServices } from './runtime-services.js';

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
  readonly services: Readonly<RuntimeServices>;
  /**
   * The full queue runtime, for worker entrypoints and introspection.
   * The same object as `services.queues`, narrowed there to the producer view.
   */
  readonly queues: QueueRuntime;
  /**
   * Disposes every constructed service in reverse construction order.
   * Idempotent. Attempts every disposer even if one fails, then throws an
   * AggregateError if any failed.
   */
  dispose(): Promise<void>;
}

export function createAppRuntime(): AppRuntime {
  const disposers: { name: string; dispose: () => Promise<void> }[] = [];
  let disposePromise: Promise<void> | undefined;

  const { queues: queueBindings = [] } = flattenAppModule(rootModule);
  const queues = createQueueRuntime(queueBindings);
  disposers.push({ name: 'queues', dispose: () => queues.stopWorkers() });

  const betterAuth = buildAuth({ queues });
  const userSession = createBetterAuthUserSessionService(betterAuth);

  const services: RuntimeServices = { queues, betterAuth, userSession };

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

  return {
    services,
    queues,
    dispose,
  };
}
