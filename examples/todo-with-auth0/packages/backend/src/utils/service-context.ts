import type { AuthContext } from '../modules/accounts/auth/types/auth-context.types.js';

import { createSystemAuthContext } from '../modules/accounts/auth/utils/auth-context.utils.js';

export interface ServiceContext {
  /* TPL_CONTEXT_INTERFACE:START */
  auth: AuthContext;
  /* TPL_CONTEXT_INTERFACE:END */
}

export function createServiceContext(
  /* TPL_CREATE_CONTEXT_ARGS:START */ {
    auth,
  }: {
    auth: AuthContext;
  } /* TPL_CREATE_CONTEXT_ARGS:END */,
): ServiceContext {
  return /* TPL_CONTEXT_OBJECT:START */ { auth } /* TPL_CONTEXT_OBJECT:END */;
}

/**
 * Creates a service context for the system user.
 */
export function createSystemServiceContext(): ServiceContext {
  return createServiceContext(
    /* TPL_SYSTEM_CONTEXT_OBJECT:START */ {
      auth: createSystemAuthContext(),
    } /* TPL_SYSTEM_CONTEXT_OBJECT:END */,
  );
}
