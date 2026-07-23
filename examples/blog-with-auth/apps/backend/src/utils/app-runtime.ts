import type { QueueRuntime } from '@src/types/queue.types.js';

import { rootModule } from '@src/modules/index.js';
import { createQueueRuntime } from '@src/services/pg-boss.service.js';

import type { RuntimeServices } from './runtime-services.js';

import { flattenAppModule } from './app-modules.js';

/**
 * Composition root for shared services. Constructs everything stateful and
 * owns disposal; nothing outside this file imports the assembled runtime.
 *
 * Construction must not connect or do I/O - allocate passive clients or
 * connect lazily. This keeps construction cheap enough for every execution
 * path, including prisma-only seeds, to afford a full service context.
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

/**
 * @param options.disableQueueMaintenance Forwarded to pg-boss - disables its
 * background maintenance/schedule loop for this runtime. Set this everywhere
 * except the one process responsible for maintenance, when pg-boss runs
 * across multiple processes (e.g. API + standalone worker).
 */
export function createAppRuntime(
  options: { disableQueueMaintenance?: boolean } = {},
): AppRuntime {
  const disposers: { name: string; dispose: () => Promise<void> }[] = [];
  let disposePromise: Promise<void> | undefined;

  const { queues: queueBindings = [] } = flattenAppModule(rootModule);
  const queues = createQueueRuntime(queueBindings, {
    disableMaintenance: options.disableQueueMaintenance,
  });
  disposers.push({ name: 'queues', dispose: () => queues.stopWorkers() });

  const services: RuntimeServices = { queues };

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
