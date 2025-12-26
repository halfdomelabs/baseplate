import type { AuthRole } from '@src/modules/accounts/constants/auth-roles.constants.js';
import type { ServiceContext } from '@src/utils/service-context.js';

/**
 * Role check function for GraphQL field authorization.
 * Instance role check - requires the root (parent) object.
 *
 * @example
 * ```typescript
 * // Instance role - uses root (parent) object
 * const ownerCheck: AuthorizeRoleRuleFunction<User> = (ctx, root) =>
 *   root.id === ctx.auth.userId;
 * ```
 */
export type AuthorizeRoleRuleFunction<RootType> = (
  ctx: ServiceContext,
  root: RootType,
) => boolean | Promise<boolean>;

/**
 * Single authorization rule - either a string (global role) or function (instance role).
 * Discrimination: `typeof rule === 'string'` for global roles.
 *
 * @example
 * ```typescript
 * // Global role (string)
 * const adminRule: AuthorizeRoleRule<any> = 'admin';
 *
 * // Instance role (function)
 * const ownerRule: AuthorizeRoleRule<User> = (ctx, root) => root.id === ctx.auth.userId;
 * ```
 */
export type AuthorizeRoleRule<RootType> =
  | AuthRole
  | AuthorizeRoleRuleFunction<RootType>;

/**
 * Authorization option - can be a single rule or array of rules.
 * If multiple rules are provided, access is granted if ANY rule returns true.
 */
export type AuthorizeRoleRuleOption<RootType> =
  | AuthorizeRoleRule<RootType>
  | AuthorizeRoleRule<RootType>[];

export interface AuthorizeRolePluginOptions {
  requireOnRootFields?: boolean;
}
