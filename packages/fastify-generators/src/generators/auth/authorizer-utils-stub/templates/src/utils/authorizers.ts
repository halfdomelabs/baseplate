// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';

import { ForbiddenError } from '%errorHandlerServiceImports';

/**
 * Global role check.
 */
export type GlobalRoleCheck = (ctx: ServiceContext) => boolean;

/**
 * Instance role check - requires the model instance.
 * Used for checking ownership or other instance-specific permissions.
 */
export type InstanceRoleCheck<TInstance> = (
  ctx: ServiceContext,
  instance: TInstance,
) => Promise<boolean> | boolean;

// ============================================================================
// Authorization Check Helpers
// ============================================================================

/**
 * Global authorization checks.
 */
export function checkGlobalAuthorization(
  ctx: ServiceContext,
  authorize: GlobalRoleCheck[],
): void {
  for (const check of authorize) {
    if (check(ctx)) return;
  }

  throw new ForbiddenError('Forbidden');
}

/**
 * Instance authorization.
 */
export async function checkInstanceAuthorization<T>(
  ctx: ServiceContext,
  instance: T | (() => Promise<T>),
  authorize: (InstanceRoleCheck<T> | GlobalRoleCheck)[],
): Promise<void> {
  const resolvedInstance =
    typeof instance === 'function'
      ? await (instance as () => Promise<T>)()
      : instance;

  // Run instance checks
  for (const check of authorize) {
    if (await check(ctx, resolvedInstance)) return;
  }

  throw new ForbiddenError('Forbidden');
}
