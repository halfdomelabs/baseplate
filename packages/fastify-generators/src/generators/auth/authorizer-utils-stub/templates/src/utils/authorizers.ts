// @ts-nocheck

import type { AuthRole } from '%authRolesImports';
import type { ServiceContext } from '%serviceContextImports';

import { ForbiddenError } from '%errorHandlerServiceImports';

/**
 * Global role check.
 */
export type GlobalRoleCheck = (
  ctx: ServiceContext,
) => Promise<boolean> | boolean;

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
 * Stub implementation - always throws ForbiddenError.
 * Global role checks require authentication to be enabled.
 */
export function checkGlobalAuthorization(
  ctx: ServiceContext,
  authorize: GlobalRoleCheck[],
): void {
  for (const check of authorize) {
    if (await check(ctx)) return;
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
  // Run instance checks
  for (const check of instanceChecks) {
    if (await check(ctx, resolvedInstance)) return;
  }

  throw new ForbiddenError('Forbidden');
}
