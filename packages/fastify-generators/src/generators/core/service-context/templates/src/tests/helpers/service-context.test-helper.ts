// @ts-nocheck

import type { ServiceContext } from '$serviceContext';
import type { AppServices } from '%appRuntimeImports';

import { createServiceContext } from '$serviceContext';

/**
 * A `ServiceContext` for tests. Reaching for a service that was not supplied
 * throws naming it, rather than reading as `undefined`.
 *
 * @param options The auth context to run as, and the services to supply.
 * @returns A {@link ServiceContext} delivering the supplied services.
 */
export function createTestServiceContext(TPL_CREATE_TEST_ARGS): ServiceContext {
  // Symbol keys fall through so inspection and test-runner diffing don't throw.
  const suppliedServices = new Proxy((services ?? {}) as AppServices, {
    get(target, key): unknown {
      if (typeof key === 'string' && !(key in target)) {
        throw new Error(
          `${key} was not supplied to createTestServiceContext. Pass it via the \`services\` option.`,
        );
      }
      return target[key as keyof AppServices];
    },
  });

  return createServiceContext(TPL_CREATE_TEST_OBJECT, suppliedServices);
}
