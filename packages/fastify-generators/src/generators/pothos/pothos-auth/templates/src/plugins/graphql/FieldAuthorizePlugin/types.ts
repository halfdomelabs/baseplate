// @ts-nocheck

import type {
  GlobalRoleCheck,
  InstanceRoleCheck,
} from '%authorizerUtilsImports';

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
  | GlobalRoleCheck
  | InstanceRoleCheck<RootType>;

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
