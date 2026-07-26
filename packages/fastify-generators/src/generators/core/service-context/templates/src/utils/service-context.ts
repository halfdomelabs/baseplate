// @ts-nocheck

import type { AppServices } from '%appRuntimeImports';

import { createAppRuntime } from '%appRuntimeImports';

/**
 * Execution-scoped state only - no services. Data services and other code
 * that only needs auth/authorizer state should declare this, not
 * {@link ServiceContext}.
 */
export interface ExecutionContext {
  TPL_CONTEXT_INTERFACE;
}

export interface ServiceContext extends ExecutionContext {
  readonly services: AppServices;
}

/**
 * A {@link ServiceContext} narrowed to only the named services, for
 * hand-written code that wants an honest signature. Structurally satisfied
 * by the full context, so callers don't need to construct anything special.
 * This is the generated default for dependency declaration - prefer it over
 * accepting the full {@link ServiceContext} where the set of services used
 * is known.
 */
export type ServiceContextWith<K extends keyof AppServices> =
  ExecutionContext & { readonly services: Pick<AppServices, K> };

export function createServiceContext(
  TPL_CREATE_CONTEXT_ARGS,
  services: AppServices,
): ServiceContext {
  return TPL_CONTEXT_OBJECT;
}

/**
 * Creates a service context for the system user, delivering the given
 * services.
 */
export function createSystemServiceContext(
  services: AppServices,
): ServiceContext {
  return createServiceContext(TPL_SYSTEM_CONTEXT_OBJECT, services);
}

/**
 * Runs `fn` with a system service context, constructing a fresh
 * `AppRuntime` around the call and guaranteeing disposal - including
 * when `fn` throws. Safe on every execution path, including prisma-only
 * scripts, because construction performs no I/O.
 */
export async function withScriptContext<T>(
  fn: (context: ServiceContext) => Promise<T>,
): Promise<T> {
  const runtime = createAppRuntime();
  try {
    return await fn(createSystemServiceContext(runtime.services));
  } finally {
    await runtime.dispose();
  }
}
