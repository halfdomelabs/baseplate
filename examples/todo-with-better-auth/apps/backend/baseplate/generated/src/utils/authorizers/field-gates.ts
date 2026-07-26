import type { AuthRole } from '@src/modules/accounts/auth/constants/auth-roles.constants.js';

import type { ServiceContext } from '../service-context.js';

import { ForbiddenError } from '../http-errors.js';

export type GlobalRoleCheck = AuthRole;

export type InstanceRoleCheck<TInstance> = (
  ctx: ServiceContext,
  instance: TInstance,
) => Promise<boolean> | boolean;

export function checkGlobalAuthorization(
  ctx: ServiceContext,
  authorize: AuthRole[],
): void {
  if (!ctx.auth.hasSomeRole(authorize)) {
    throw new ForbiddenError('Forbidden');
  }
}

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
