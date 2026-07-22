import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import { quot } from '@baseplate-dev/utils';

import type { AuthorizerUtilsImportsProvider } from '../../../auth/_providers/authorizer-utils-imports.js';

interface ModelPolicyLike {
  /** Returns a role's instance-check member (`policy.roles.owner.check`). */
  getRoleCheckFragment(roleName: string): TsCodeFragment;
}

interface GenerateAuthorizationStatementsConfig {
  /** Model name (lowercase) for error messages */
  modelName: string;
  /** Method type for error messages */
  methodType: string;
  /** Global roles (e.g., ['admin', 'user']) */
  globalRoles?: string[];
  /** Instance roles (e.g., ['owner']) — assumes `existingItem` is in scope */
  instanceRoles?: string[];
  /** Model policy provider (required if instanceRoles is set) */
  modelPolicy: ModelPolicyLike | undefined;
  /** Authorizer imports provider */
  authorizerImports: AuthorizerUtilsImportsProvider;
}

interface AuthorizationStatements {
  /**
   * Fragment with authorization check statement.
   *
   * For global-only auth:
   * ```
   * checkGlobalAuthorization(context, ['admin']);
   * ```
   *
   * For instance auth (assumes `existingItem` is already in scope):
   * ```
   * await checkInstanceAuthorization(context, existingItem, ['admin', xAuthorizer.roles.owner]);
   * ```
   */
  fragment: TsCodeFragment | '';
  /** Whether instance authorization is used (caller must ensure existingItem is in scope) */
  hasInstanceAuth: boolean;
}

/**
 * Generates explicit authorization check statements.
 *
 * Does NOT emit the `existingItem` fetch — the caller is responsible for
 * ensuring `existingItem` is in scope when instance roles are used.
 */
export function generateAuthorizationStatements(
  config: GenerateAuthorizationStatementsConfig,
): AuthorizationStatements {
  const {
    modelName,
    methodType,
    globalRoles,
    instanceRoles,
    modelPolicy,
    authorizerImports,
  } = config;

  const hasGlobalRoles = globalRoles != null && globalRoles.length > 0;
  const hasInstanceRoles = instanceRoles != null && instanceRoles.length > 0;

  if (!hasGlobalRoles && !hasInstanceRoles) {
    return { fragment: '', hasInstanceAuth: false };
  }

  // Build role items array
  const globalRoleItems = (globalRoles ?? []).map((r) => quot(r));
  const instanceRoleFragments = (instanceRoles ?? []).map((roleName) => {
    if (!modelPolicy) {
      throw new Error(
        `${methodType} method on model '${modelName}' references instance role '${roleName}' but no policy is configured for this model.`,
      );
    }
    return modelPolicy.getRoleCheckFragment(roleName);
  });

  if (hasInstanceRoles) {
    // Instance auth: assumes existingItem is already in scope
    const allRoleItems = [
      ...globalRoleItems,
      ...instanceRoleFragments.map((f) => f.contents),
    ];
    const rolesArray = `[${allRoleItems.join(', ')}]`;
    const rolesFrag = TsCodeUtils.frag(
      rolesArray,
      instanceRoleFragments.flatMap((f) => f.imports ?? []),
    );

    return {
      fragment: tsTemplate`await ${authorizerImports.checkInstanceAuthorization.fragment()}(context, existingItem, ${rolesFrag});`,
      hasInstanceAuth: true,
    };
  }

  // Global auth only
  const rolesArray = `[${globalRoleItems.join(', ')}]`;
  return {
    fragment: tsTemplate`${authorizerImports.checkGlobalAuthorization.fragment()}(context, ${rolesArray});`,
    hasInstanceAuth: false,
  };
}
