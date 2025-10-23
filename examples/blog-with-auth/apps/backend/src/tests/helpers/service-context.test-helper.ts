import type { AuthContext } from '@src/modules/accounts/types/auth-context.types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { createAuthContextFromSessionInfo } from '@src/modules/accounts/utils/auth-context.utils.js';
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
  );
}
