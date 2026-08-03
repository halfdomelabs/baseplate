import type { AuthContext } from '@src/modules/accounts/auth/types/auth-context.types.js';
import type { RuntimeServices } from '@src/utils/runtime-services.js';
import type { SystemServiceContext } from '@src/utils/service-context.js';

import { createAuthContextFromSessionInfo } from '@src/modules/accounts/auth/utils/auth-context.utils.js';
import { createServiceContext } from '@src/utils/service-context.js';

/**
 * A service context for tests. Reaching for a service that was not supplied
 * throws naming it, rather than reading as `undefined`.
 *
 * @param options The auth context to run as, and the services to supply.
 * @returns A {@link SystemServiceContext} delivering the supplied services.
 */
export function createTestServiceContext(
  /* TPL_CREATE_TEST_ARGS:START */ {
    auth,
    services,
  }: {
    auth?: AuthContext;
    services?: Partial<RuntimeServices>;
  } = {} /* TPL_CREATE_TEST_ARGS:END */,
): SystemServiceContext {
  // Symbol keys fall through so inspection and test-runner diffing don't throw.
  const suppliedServices = new Proxy(
    /* TPL_SUPPLIED_SERVICES:START */ (services ??
      {}) as RuntimeServices /* TPL_SUPPLIED_SERVICES:END */,
    {
      get(target, key): unknown {
        if (typeof key === 'string' && !(key in target)) {
          throw new Error(
            `${key} was not supplied to createTestServiceContext. Pass it via the \`services\` option.`,
          );
        }
        return target[key as keyof RuntimeServices];
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
