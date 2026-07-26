import type { AuthContext } from '@src/modules/accounts/auth/types/auth-context.types.js';
import type { AppServices } from '@src/utils/runtime-services.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { createAuthContextFromSessionInfo } from '@src/modules/accounts/auth/utils/auth-context.utils.js';
import { createServiceContext } from '@src/utils/service-context.js';

/**
 * A `ServiceContext` for tests. Reaching for a service that was not supplied
 * throws naming it, rather than reading as `undefined`.
 *
 * @param options The auth context to run as, and the services to supply.
 * @returns A {@link ServiceContext} delivering the supplied services.
 */
export function createTestServiceContext(
  /* TPL_CREATE_TEST_ARGS:START */ {
    auth,
    services,
  }: {
    auth?: AuthContext;
    services?: Partial<AppServices>;
  } = {} /* TPL_CREATE_TEST_ARGS:END */,
): ServiceContext {
  // Symbol keys fall through so inspection and test-runner diffing don't throw.
  const suppliedServices = new Proxy(
    /* TPL_SUPPLIED_SERVICES:START */ (services ??
      {}) as AppServices /* TPL_SUPPLIED_SERVICES:END */,
    {
      get(target, key): unknown {
        if (typeof key === 'string' && !(key in target)) {
          throw new Error(
            `${key} was not supplied to createTestServiceContext. Pass it via the \`services\` option.`,
          );
        }
        return target[key as keyof AppServices];
      },
    },
  );

  return createServiceContext(
    /* TPL_CREATE_TEST_OBJECT:START */ {
      auth: auth ?? createAuthContextFromSessionInfo(undefined),
    } /* TPL_CREATE_TEST_OBJECT:END */,
    suppliedServices,
  );
}
