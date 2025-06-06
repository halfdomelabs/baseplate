// @ts-nocheck

export interface RoleConfig {
  /**
   * A human-readable description of the role.
   */
  comment: string;
  /**
   * Whether this role is built-in and is added automatically to the user context.
   *
   * These roles should not be added to the user directly.
   */
  builtIn: boolean;
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
