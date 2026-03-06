/**
 * Validator for authorizer expressions.
 *
 * Validates that:
 * - Model field references exist on the parent model
 * - Auth field references are valid AuthContext properties
 * - Role names exist in project config (warning only)
 */

import type { PluginSpecStore } from '#src/plugins/index.js';
import type { RefExpressionWarning } from '#src/references/expression-types.js';
import type { ProjectDefinition } from '#src/schema/project-definition.js';

import { authConfigSpec } from '#src/plugins/spec/auth-config-spec.js';

import type {
  AuthorizerExpressionNode,
  FieldRefNode,
} from './authorizer-expression-ast.js';

/**
 * Information about a model relation for nested authorizer validation.
 */
export interface RelationValidationInfo {
  /** Number of foreign key references (must be 1 for nested authorizer support) */
  referenceCount: number;
  /** Foreign model name (for error messages) */
  foreignModelName: string;
  /** Set of role names defined on the foreign model's authorizer */
  foreignAuthorizerRoleNames: Set<string>;
}

/**
 * Model information needed for validation.
 */
export interface ModelValidationContext {
  /** The model name (for error messages) */
  modelName: string;
  /** Set of valid scalar field names on the model */
  scalarFieldNames: Set<string>;
  /** Map of relation name → relation validation info (for nested authorizer checks) */
  relationInfo?: Map<string, RelationValidationInfo>;
}

/**
 * Valid auth context field names that can be accessed.
 */
const VALID_AUTH_FIELDS = new Set(['userId']);

/**
 * Information about auth roles from the project configuration.
 */
interface AuthRoleInfo {
  /** All defined role names */
  allRoleNames: Set<string>;
  /** Role names that are built-in (e.g., 'system', 'public', 'user') */
  builtInRoleNames: Set<string>;
}

/**
 * Get role info from the project definition using the auth config spec.
 *
 * @param pluginStore - The plugin spec store
 * @param definition - The raw project definition data
 * @returns Role information including built-in status
 */
function getAuthRoleInfo(
  pluginStore: PluginSpecStore,
  definition: unknown,
): AuthRoleInfo {
  const authConfig = pluginStore.use(authConfigSpec);

  const roles = authConfig.getAuthConfig(
    definition as ProjectDefinition,
  )?.roles;
  return {
    allRoleNames: new Set(roles?.map((role) => role.name)),
    builtInRoleNames: new Set(
      roles?.filter((role) => role.builtIn).map((role) => role.name),
    ),
  };
}

/**
 * Validate an authorizer expression AST against model and project context.
 *
 * @param ast - The parsed expression AST
 * @param modelContext - Information about the parent model
 * @param pluginStore - The plugin spec store for accessing auth config
 * @param definition - The raw project definition data
 * @returns Array of warnings (errors are thrown, warnings are returned)
 *
 * @example
 * ```typescript
 * const warnings = validateAuthorizerExpression(
 *   ast,
 *   { modelName: 'User', scalarFieldNames: new Set(['id', 'email']) },
 *   pluginStore,
 *   definition,
 * );
 * ```
 */
export function validateAuthorizerExpression(
  ast: AuthorizerExpressionNode,
  modelContext: ModelValidationContext,
  pluginStore: PluginSpecStore,
  definition: unknown,
): RefExpressionWarning[] {
  const warnings: RefExpressionWarning[] = [];
  const { allRoleNames, builtInRoleNames } = getAuthRoleInfo(
    pluginStore,
    definition,
  );
  const nonBuiltInRoleNames = [...allRoleNames].filter(
    (name) => !builtInRoleNames.has(name),
  );

  function warnIfBuiltInRole(role: string, start: number, end: number): void {
    if (builtInRoleNames.has(role)) {
      const message =
        role === 'user'
          ? `Role 'user' is a built-in role. Use 'isAuthenticated' instead to check if the user is authenticated.`
          : `Role '${role}' is a built-in role and should not be used in authorizer expressions. Use non-built-in roles: ${nonBuiltInRoleNames.join(', ')}.`;
      warnings.push({ message, start, end });
    }
  }

  function walk(node: AuthorizerExpressionNode): void {
    switch (node.type) {
      case 'fieldComparison': {
        validateFieldRef(node.left);
        validateFieldRef(node.right);
        break;
      }

      case 'hasRole': {
        // Warn if role doesn't exist (but allow - plugins may define roles)
        if (allRoleNames.has(node.role)) {
          warnIfBuiltInRole(node.role, node.roleStart, node.roleEnd);
        } else {
          warnings.push({
            message: `Role '${node.role}' is not defined in the project configuration. Available roles: ${[...allRoleNames].join(', ')}.`,
            start: node.roleStart,
            end: node.roleEnd,
          });
        }
        break;
      }

      case 'hasSomeRole': {
        for (let i = 0; i < node.roles.length; i++) {
          const role = node.roles[i];
          const start = node.rolesStart[i];
          const end = node.rolesEnd[i];
          if (allRoleNames.has(role)) {
            warnIfBuiltInRole(role, start, end);
          } else {
            warnings.push({
              message: `Role '${role}' is not defined in the project configuration. Available roles: ${[...allRoleNames].join(', ')}.`,
              start,
              end,
            });
          }
        }
        break;
      }

      case 'nestedHasRole': {
        validateNestedRelation(
          node.relationName,
          node.relationStart,
          node.relationEnd,
          [node.role],
          [node.roleStart],
          [node.roleEnd],
        );
        break;
      }

      case 'nestedHasSomeRole': {
        validateNestedRelation(
          node.relationName,
          node.relationStart,
          node.relationEnd,
          node.roles,
          node.rolesStart,
          node.rolesEnd,
        );
        break;
      }

      case 'isAuthenticated': {
        // No validation needed
        break;
      }

      case 'binaryLogical': {
        walk(node.left);
        walk(node.right);
        break;
      }
    }
  }

  function validateNestedRelation(
    relationName: string,
    relationStart: number,
    relationEnd: number,
    roles: string[],
    rolesStart: number[],
    rolesEnd: number[],
  ): void {
    const { relationInfo } = modelContext;
    if (!relationInfo) {
      // Can't validate without relation info
      return;
    }

    const relation = relationInfo.get(relationName);
    if (!relation) {
      const availableRelations = [...relationInfo.keys()].join(', ');
      warnings.push({
        message: `Relation '${relationName}' does not exist on model '${modelContext.modelName}'.${availableRelations ? ` Available relations: ${availableRelations}.` : ''}`,
        start: relationStart,
        end: relationEnd,
      });
      return;
    }

    if (relation.referenceCount !== 1) {
      warnings.push({
        message: `Relation '${relationName}' has ${relation.referenceCount} foreign key references. Nested authorizer checks only support single-key relations.`,
        start: relationStart,
        end: relationEnd,
      });
      return;
    }

    // Validate each role exists on the foreign model's authorizer
    for (const [i, role] of roles.entries()) {
      if (!relation.foreignAuthorizerRoleNames.has(role)) {
        const availableRoles = [...relation.foreignAuthorizerRoleNames].join(
          ', ',
        );
        warnings.push({
          message: `Role '${role}' is not defined on model '${relation.foreignModelName}' authorizer.${availableRoles ? ` Available roles: ${availableRoles}.` : ''}`,
          start: rolesStart[i],
          end: rolesEnd[i],
        });
      }
    }
  }

  function validateFieldRef(node: FieldRefNode): void {
    if (node.source === 'model') {
      // Check if field exists on model
      if (!modelContext.scalarFieldNames.has(node.field)) {
        warnings.push({
          message: `Field '${node.field}' does not exist on model '${modelContext.modelName}'.`,
          start: node.start,
          end: node.end,
        });
      }
    } else if (!VALID_AUTH_FIELDS.has(node.field)) {
      // node.source === 'auth' is implied since source is 'model' | 'auth'
      warnings.push({
        message: `Invalid auth property '${node.field}'. Valid properties are: ${[...VALID_AUTH_FIELDS].join(', ')}.`,
        start: node.start,
        end: node.end,
      });
    }
  }

  walk(ast);

  return warnings;
}

/**
 * Extract model validation context from a model configuration.
 *
 * @param modelConfig - The parsed model configuration
 * @returns Model validation context for the validator
 */
export function createModelValidationContext(modelConfig: {
  name: string;
  fields?: { name: string }[];
}): ModelValidationContext {
  const scalarFieldNames = new Set<string>();

  for (const field of modelConfig.fields ?? []) {
    scalarFieldNames.add(field.name);
  }

  return {
    modelName: modelConfig.name,
    scalarFieldNames,
  };
}
