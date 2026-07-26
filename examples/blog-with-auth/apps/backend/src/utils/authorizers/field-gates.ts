import type { AuthRole } from '@src/modules/accounts/auth/constants/auth-roles.constants.js';

import type { ServiceContext } from '../service-context.js';

import { ForbiddenError } from '../http-errors.js';

// ============================================================================
// Field-gate rules (consumed by the GraphQL FieldAuthorizePlugin)
// ----------------------------------------------------------------------------
// A field `authorize:` rule is either a GLOBAL role (a string, checked via
// `ctx.auth.hasSomeRole`) or an INSTANCE check — a `(ctx, model) => boolean`.
// A policy role's `.check` member satisfies `InstanceRoleCheck` exactly, so a
// field gate reads `authorize: ['admin', userPolicy.roles.self.check]`.
// ============================================================================

/** A global-role field-gate rule — a role string. */
export type GlobalRoleCheck = AuthRole;

/** An instance field-gate rule — satisfied by `policy.roles.<name>.check`. */
export type InstanceRoleCheck<TInstance> = (
  ctx: ServiceContext,
  instance: TInstance,
) => Promise<boolean> | boolean;

/** Throw unless the principal holds one of the global roles. */
export function checkGlobalAuthorization(
  ctx: ServiceContext,
  authorize: AuthRole[],
): void {
  if (!ctx.auth.hasSomeRole(authorize)) {
    throw new ForbiddenError('Forbidden');
  }
}

/**
 * OR of field-gate rules: global roles (strings) checked first via
 * `hasSomeRole`, then instance checks (functions) run sequentially with lazy
 * instance loading. Throws `ForbiddenError` if none pass.
 */
export async function checkInstanceAuthorization<T>(
  ctx: ServiceContext,
  instance: T | (() => Promise<T>),
  authorize: (InstanceRoleCheck<T> | AuthRole)[],
): Promise<void> {
  const globalRoles = authorize.filter(
    (check): check is AuthRole => typeof check === 'string',
  );
  const instanceChecks = authorize.filter(
    (check): check is InstanceRoleCheck<T> => typeof check === 'function',
  );

  if (globalRoles.length > 0 && ctx.auth.hasSomeRole(globalRoles)) {
    return;
  }

  if (instanceChecks.length > 0) {
    const resolvedInstance =
      typeof instance === 'function'
        ? await (instance as () => Promise<T>)()
        : instance;

    for (const check of instanceChecks) {
      if (await check(ctx, resolvedInstance)) return;
    }
  }

  throw new ForbiddenError('Forbidden');
}
