// @ts-nocheck

import type { AuthRole } from '%authRolesImports';

import { AUTH_ROLE_CONFIG } from '%authRolesImports';
import { builder } from '%pothosImports';

/**
 * GraphQL enum for authentication roles.
 *
 * This enum represents all available roles that can be assigned to users
 * or used for authorization checks in the application.
 */
export const authRoleEnum = builder.enumType('AuthRole', {
  values: Object.fromEntries(
    Object.entries(AUTH_ROLE_CONFIG).map(([role, config]) => [
      role,
      { value: role, description: config.comment },
    ]),
  ) as Record<AuthRole, { value: AuthRole; description: string }>,
});
