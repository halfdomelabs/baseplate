import type { AuthContext } from '../modules/accounts/auth/types/auth-context.types.js';
import type { AppRuntime } from './app-runtime.js';
import type { RuntimeServices } from './runtime-services.js';

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
  /* TPL_CREATE_CONTEXT_ARGS:START */ {
    auth,
  }: {
    auth: AuthContext;
  } /* TPL_CREATE_CONTEXT_ARGS:END */,
  services: Readonly<RuntimeServices>,
): ServiceContext {
  return /* TPL_CONTEXT_OBJECT:START */ {
    auth,
    authorizerCache: new Map<string, boolean>(),
    authorizerModelCache: new Map<string, unknown>(),
    services,
  } /* TPL_CONTEXT_OBJECT:END */;
}

/**
 * Creates a service context for the system user, delivering services from
 * the given runtime.
 */
export function createSystemServiceContext(
  runtime: AppRuntime,
): ServiceContext {
  return createServiceContext(
    /* TPL_SYSTEM_CONTEXT_OBJECT:START */ {
      auth: createSystemAuthContext(),
    } /* TPL_SYSTEM_CONTEXT_OBJECT:END */,
    runtime.services,
  );
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
