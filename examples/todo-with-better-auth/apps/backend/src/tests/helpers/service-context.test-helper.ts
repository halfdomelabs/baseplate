import type { Auth } from '@src/modules/accounts/auth/services/auth.js';
import type { AuthContext } from '@src/modules/accounts/auth/types/auth-context.types.js';
import type { UserSessionService } from '@src/modules/accounts/auth/types/user-session.types.js';
import type { RuntimeServices } from '@src/utils/runtime-services.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { createAuthContextFromSessionInfo } from '@src/modules/accounts/auth/utils/auth-context.utils.js';
import { createServiceContext } from '@src/utils/service-context.js';

/**
 * A {@link RuntimeServices} stub for tests that need a {@link ServiceContext}
 * but never touch queues or better-auth directly.
 */
const testRuntimeServices: RuntimeServices = {
  queues: {
    enqueue: () => {
      throw new Error('Queues are not available in this test context.');
    },
  },
  betterAuth: new Proxy(
    {},
    {
      get() {
        throw new Error('better-auth is not available in this test context.');
      },
    },
  ) as Auth,
  userSession: new Proxy(
    {},
    {
      get() {
        throw new Error('userSession is not available in this test context.');
      },
    },
  ) as UserSessionService,
};

export function createTestServiceContext(
  /* TPL_CREATE_TEST_ARGS:START */ {
    auth,
  }: {
    auth?: AuthContext;
  } = {} /* TPL_CREATE_TEST_ARGS:END */,
): ServiceContext {
  return createServiceContext(
    /* TPL_CREATE_TEST_OBJECT:START */ {
      auth: auth ?? createAuthContextFromSessionInfo(undefined),
    } /* TPL_CREATE_TEST_OBJECT:END */,
    testRuntimeServices,
  );
}
