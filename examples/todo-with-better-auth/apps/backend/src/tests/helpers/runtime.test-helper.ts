import type { AppRuntime } from '@src/utils/app-runtime.js';
import type { AppServices } from '@src/utils/runtime-services.js';

/**
 * An {@link AppRuntime} assembled from the services a test hands it.
 *
 * Nothing is constructed - this is a passthrough around the supplied objects -
 * so no client is built, no config is read, and no connection is opened.
 * `dispose()` is a no-op, since the test owns everything it supplied.
 *
 * The supplied services are reflected in the result's type, so reaching for a
 * service the test never supplied is a compile error. Runtime-only objects
 * (`queues`, `redis`) are absent unless supplied via `runtime`.
 *
 * @param services The services the code under test consumes.
 * @param runtime Runtime-only objects, for code that reaches past `services`.
 * @returns An {@link AppRuntime} delivering exactly those services.
 */
export function createTestRuntime<K extends keyof AppServices>(
  services: Pick<AppServices, K>,
  runtime: Partial<Omit<AppRuntime, 'services' | 'dispose'>> = {},
): AppRuntime<Pick<AppServices, K>> {
  return {
    services,
    ...runtime,
    dispose: () => Promise.resolve(),
  } as AppRuntime<Pick<AppServices, K>>;
}
