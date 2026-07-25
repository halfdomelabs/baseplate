import type { AuthContext } from '@src/modules/accounts/auth/types/auth-context.types.js';
import type { AppServices } from '@src/utils/runtime-services.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { createAuthContextFromSessionInfo } from '@src/modules/accounts/auth/utils/auth-context.utils.js';
import { createServiceContext } from '@src/utils/service-context.js';

/**
 * A `ServiceContext` for tests, carrying only the services it is handed.
 *
 * Services the test does not supply are absent rather than stubbed, so code
 * reaching for one fails on access instead of reading a silent `undefined`.
 * Supply whatever the code under test consumes.
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
  return createServiceContext(
    /* TPL_CREATE_TEST_OBJECT:START */ {
      auth: auth ?? createAuthContextFromSessionInfo(undefined),
    } /* TPL_CREATE_TEST_OBJECT:END */,
    // Data services still declare the full `ServiceContext`, so the bag is
    // typed as complete; only what a test supplies actually exists.
    (services ?? {}) as AppServices,
  );
}
