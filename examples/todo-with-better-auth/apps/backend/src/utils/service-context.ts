import type { AuthContext } from '../modules/accounts/auth/types/auth-context.types.js';
import type { AppServices } from './runtime-services.js';

import { createSystemAuthContext } from '../modules/accounts/auth/utils/auth-context.utils.js';
import { createAppRuntime } from './app-runtime.js';

/**
 * Execution-scoped state only - no services. Data services and other code
 * that only needs auth/authorizer state should declare this, not
 * {@link ServiceContext}.
 */
export interface ExecutionContext {
  /* TPL_CONTEXT_INTERFACE:START */
  auth: AuthContext;
  authorizerCache: Map<string, boolean>;
  authorizerModelCache: Map<string, unknown>;
  /* TPL_CONTEXT_INTERFACE:END */
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
  /* TPL_CREATE_CONTEXT_ARGS:START */ {
    auth,
  }: {
    auth: AuthContext;
  } /* TPL_CREATE_CONTEXT_ARGS:END */,
  services: AppServices,
): ServiceContext {
  return /* TPL_CONTEXT_OBJECT:START */ {
    auth,
    authorizerCache: new Map<string, boolean>(),
    authorizerModelCache: new Map<string, unknown>(),
    services,
  } /* TPL_CONTEXT_OBJECT:END */;
}

/**
 * Creates a service context for the system user, delivering the given
 * services.
 */
export function createSystemServiceContext(
  services: AppServices,
): ServiceContext {
  return createServiceContext(
    /* TPL_SYSTEM_CONTEXT_OBJECT:START */ {
      auth: createSystemAuthContext(),
    } /* TPL_SYSTEM_CONTEXT_OBJECT:END */,
    services,
  );
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
