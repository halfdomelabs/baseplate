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
  readonly services: Readonly<RuntimeServices>;
  TPL_RUNTIME_FIELDS;
  /**
   * Disposes every constructed service in reverse construction order.
   * Idempotent. Attempts every disposer even if one fails, then throws an
   * AggregateError if any failed.
   */
  dispose(): Promise<void>;
}

export function createAppRuntime(TPL_OPTIONS_PARAM): AppRuntime {
  const disposers: { name: string; dispose: () => Promise<void> }[] = [];
  let disposePromise: Promise<void> | undefined;

  TPL_SERVICE_CONSTRUCTION;

  const services: RuntimeServices = TPL_SERVICES_OBJECT;

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

  const runtime = TPL_RUNTIME_FIELD_VALUES;

  return { ...runtime, services, dispose };
}
