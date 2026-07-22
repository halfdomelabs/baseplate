// @ts-nocheck

import type { RuntimeServices } from '$runtimeServices';

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
  services: Readonly<RuntimeServices>;
  /**
   * Disposes every constructed service in reverse construction order.
   * Idempotent. Attempts every disposer even if one fails, then throws an
   * AggregateError if any failed.
   */
  dispose(): Promise<void>;
}

export async function createAppRuntime(): Promise<AppRuntime> {
  const disposers: { name: string; dispose: () => Promise<void> }[] = [];
  let disposed = false;

  // No plugins registered yet - delete this await once the first one adds a
  // real one.
  await Promise.resolve();

  const services: RuntimeServices = {};

  async function dispose(): Promise<void> {
    if (disposed) {
      return;
    }
    disposed = true;

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

  return {
    services,
    dispose,
  };
}
