export interface ServiceContext {
  placeholder?: never;
}

export function createServiceContext(): ServiceContext {
  return {};
}

/**
 * Creates a service context for the system user.
 */
export function createSystemServiceContext(): ServiceContext {
  return createServiceContext({});
}
