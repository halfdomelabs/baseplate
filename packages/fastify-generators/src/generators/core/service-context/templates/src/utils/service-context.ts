// @ts-nocheck

import type { AppRuntime, RuntimeServices } from '%appRuntimeImports';

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
  readonly services: Readonly<RuntimeServices>;
}

/**
 * A {@link ServiceContext} narrowed to only the named services, for
 * hand-written code that wants an honest signature. Structurally satisfied
 * by the full context, so callers don't need to construct anything special.
 * This is the generated default for dependency declaration - prefer it over
 * accepting the full {@link ServiceContext} where the set of services used
 * is known.
 */
export type ServiceContextWith<K extends keyof RuntimeServices> =
  ExecutionContext & { readonly services: Readonly<Pick<RuntimeServices, K>> };

export function createServiceContext(
  TPL_CREATE_CONTEXT_ARGS,
  services: Readonly<RuntimeServices>,
): ServiceContext {
  return TPL_CONTEXT_OBJECT;
}

/**
 * Creates a service context for the system user, delivering services from
 * the given runtime.
 */
export function createSystemServiceContext(
  runtime: AppRuntime,
): ServiceContext {
  return createServiceContext(TPL_SYSTEM_CONTEXT_OBJECT, runtime.services);
}

/**
 * Runs `fn` with a system service context, constructing a fresh
 * {@link AppRuntime} around the call and guaranteeing disposal - including
 * when `fn` throws. Safe on every execution path, including prisma-only
 * scripts, because construction performs no I/O.
 */
export async function withScriptContext<T>(
  fn: (context: ServiceContext) => Promise<T>,
): Promise<T> {
  const runtime = await createAppRuntime();
  try {
    return await fn(createSystemServiceContext(runtime));
  } finally {
    await runtime.dispose();
  }
}
