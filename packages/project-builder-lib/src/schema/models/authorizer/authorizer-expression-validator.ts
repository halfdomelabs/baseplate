/**
 * Validator for authorizer expressions.
 *
 * Validates that:
 * - Model field references exist on the parent model
 * - Auth field references are valid AuthContext properties
 * - Role names exist in project config (warning only)
 */

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { RefExpressionWarning } from '#src/references/expression-types.js';

import { authConfigSpec } from '#src/plugins/spec/auth-config-spec.js';

import type {
  AuthorizerExpressionNode,
  FieldRefNode,
} from './authorizer-expression-ast.js';

/**
 * Model information needed for validation.
 */
export interface ModelValidationContext {
  /** The model name (for error messages) */
  modelName: string;
  /** Set of valid scalar field names on the model */
  scalarFieldNames: Set<string>;
}

/**
 * Valid auth context field names that can be accessed.
 */
const VALID_AUTH_FIELDS = new Set(['userId']);

/**
 * Get role names from the project definition container using the auth config spec.
 *
 * @param container - The project definition container
 * @returns Set of defined role names
 */
function getRoleNames(container: ProjectDefinitionContainer): Set<string> {
  const authConfig = container.pluginStore.use(authConfigSpec);

  const roles = authConfig.getAuthConfig(container.definition)?.roles;
  return new Set(roles?.map((role) => role.name) ?? []);
}

/**
 * Validate an authorizer expression AST against model and project context.
 *
 * @param ast - The parsed expression AST
 * @param modelContext - Information about the parent model
 * @param container - The project definition container for accessing roles
 * @returns Array of warnings (errors are thrown, warnings are returned)
 *
 * @example
 * ```typescript
 * const warnings = validateAuthorizerExpression(
 *   ast,
 *   { modelName: 'User', scalarFieldNames: new Set(['id', 'email']) },
 *   container,
 * );
 * ```
 */
export function validateAuthorizerExpression(
  ast: AuthorizerExpressionNode,
  modelContext: ModelValidationContext,
  container: ProjectDefinitionContainer,
): RefExpressionWarning[] {
  const warnings: RefExpressionWarning[] = [];
  const roleNames = getRoleNames(container);

  function walk(node: AuthorizerExpressionNode): void {
    switch (node.type) {
      case 'fieldComparison': {
        validateFieldRef(node.left);
        validateFieldRef(node.right);
        break;
      }

      case 'hasRole': {
        // Warn if role doesn't exist (but allow - plugins may define roles)
        if (!roleNames.has(node.role)) {
          warnings.push({
            message: `Role '${node.role}' is not defined in the project configuration. It may be defined by a plugin.`,
          });
        }
        break;
      }

      case 'binaryLogical': {
        walk(node.left);
        walk(node.right);
        break;
      }
    }
  }

  function validateFieldRef(node: FieldRefNode): void {
    if (node.source === 'model') {
      // Check if field exists on model
      if (!modelContext.scalarFieldNames.has(node.field)) {
        warnings.push({
          message: `Field '${node.field}' does not exist on model '${modelContext.modelName}'.`,
        });
      }
    } else if (!VALID_AUTH_FIELDS.has(node.field)) {
      // node.source === 'auth' is implied since source is 'model' | 'auth'
      warnings.push({
        message: `Invalid auth property '${node.field}'. Valid properties are: ${[...VALID_AUTH_FIELDS].join(', ')}.`,
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
