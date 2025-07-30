// @ts-nocheck

export interface ServiceContext {
  TPL_CONTEXT_INTERFACE;
}

export function createServiceContext(TPL_CREATE_CONTEXT_ARGS): ServiceContext {
  return TPL_CONTEXT_OBJECT;
}

/**
 * Creates a service context for the system user.
 */
export function createSystemServiceContext(): ServiceContext {
  return createServiceContext(TPL_SYSTEM_CONTEXT_OBJECT);
}
