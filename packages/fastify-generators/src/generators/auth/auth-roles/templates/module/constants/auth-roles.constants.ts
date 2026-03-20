// @ts-nocheck

export interface RoleConfig {
  /**
   * A human-readable description of the role.
   */
  comment: string;
  /**
   * Whether this role is automatically assigned to all user contexts.
   *
   * Auto-assigned roles (public, user, system) should not be used in
   * authorizer expressions or assigned to users directly.
   */
  autoAssigned: boolean;
}

/**
 * The configuration for the roles that can be assigned to requests.
 */
export const AUTH_ROLE_CONFIG = Object.freeze(TPL_AUTH_ROLES) satisfies Record<
  string,
  RoleConfig
>;

/**
 * The roles that can be assigned to users.
 */
export type AuthRole = keyof typeof AUTH_ROLE_CONFIG;

/**
 * The roles that are automatically assigned to all users (authenticated and unauthenticated).
 */
export const DEFAULT_PUBLIC_ROLES: readonly AuthRole[] = Object.freeze([
  'public',
]);

/**
 * The roles that are automatically assigned to authenticated users.
 */
export const DEFAULT_USER_ROLES: readonly AuthRole[] = Object.freeze([
  ...DEFAULT_PUBLIC_ROLES,
  'user',
]);
