import type { CookieUserSessionService } from '@src/modules/accounts/auth/services/user-session.service.js';
import type { AuthContext } from '@src/modules/accounts/auth/types/auth-context.types.js';
import type { QueueService } from '@src/types/queue.types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { createAuthContextFromSessionInfo } from '@src/modules/accounts/auth/utils/auth-context.utils.js';
import { createServiceContext } from '@src/utils/service-context.js';

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
    /* TPL_TEST_RUNTIME_SERVICES:START */ {
      queues: new Proxy(
        {},
        {
          get() {
            throw new Error('queues is not available in this test context.');
          },
        },
      ) as QueueService,
      userSession: new Proxy(
        {},
        {
          get() {
            throw new Error(
              'userSession is not available in this test context.',
            );
          },
        },
      ) as CookieUserSessionService,
    } /* TPL_TEST_RUNTIME_SERVICES:END */,
  );
}
