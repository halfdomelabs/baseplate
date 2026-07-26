// @ts-nocheck

import type { AppServices } from '$runtimeServices';

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

export function createAppRuntime(TPL_OPTIONS_PARAM): AppRuntime {
  const disposers: { name: string; dispose: () => Promise<void> }[] = [];
  let disposePromise: Promise<void> | undefined;
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

  TPL_SERVICE_CONSTRUCTION;

  const services = TPL_SERVICES_OBJECT satisfies AppServices;

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
