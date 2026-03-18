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
  LiteralValueNode,
} from './authorizer-expression-ast.js';
import type { AuthorizerExpressionVisitor } from './authorizer-expression-visitor.js';

import { visitAuthorizerExpression } from './authorizer-expression-visitor.js';

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
  /** Scalar field names on the foreign model (for relation filter condition validation) */
  foreignScalarFieldNames?: Set<string>;
  /** Field type map for the foreign model (for type-checking relation filter condition values) */
  foreignFieldTypes?: Map<string, string>;
  /** Whether this is a local relation (FK on this model) or foreign/reverse (FK on the other model) */
  direction: 'local' | 'foreign';
}

/**
 * Model information needed for validation.
 */
export interface ModelValidationContext {
  /** The model name (for error messages) */
  modelName: string;
  /** Set of valid scalar field names on the model */
  scalarFieldNames: Set<string>;
  /** Map of field name → field type (for literal type-checking) */
  fieldTypes: Map<string, string>;
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
  /** Role names that are auto-assigned (e.g., 'system', 'public', 'user') and should not be used in authorizer expressions */
  autoAssignedRoleNames: Set<string>;
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
    autoAssignedRoleNames: new Set(
      roles?.filter((role) => role.autoAssigned).map((role) => role.name),
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
  const { allRoleNames, autoAssignedRoleNames } = getAuthRoleInfo(
    pluginStore,
    definition,
  );
  const assignableRoleNames = [...allRoleNames].filter(
    (name) => !autoAssignedRoleNames.has(name),
  );

  function warnIfAutoAssignedRole(
    role: string,
    start: number,
    end: number,
  ): void {
    if (autoAssignedRoleNames.has(role)) {
      const message =
        role === 'user'
          ? `Role 'user' is an auto-assigned role. Use 'isAuthenticated' instead to check if the user is authenticated.`
          : `Role '${role}' is an auto-assigned role and should not be used in authorizer expressions. Use assignable roles: ${assignableRoleNames.join(', ')}.`;
      warnings.push({ message, start, end });
    }
  }

  const validationVisitor: AuthorizerExpressionVisitor<void> = {
    fieldComparison(node) {
      if (node.left.type === 'fieldRef') {
        validateFieldRef(node.left);
      }
      if (node.right.type === 'fieldRef') {
        validateFieldRef(node.right);
      }
      // Type-check: warn if a model field is compared to an incompatible literal
      const fieldRef = node.left.type === 'fieldRef' ? node.left : node.right;
      const literalNode =
        node.left.type === 'literalValue'
          ? node.left
          : node.right.type === 'literalValue'
            ? node.right
            : null;
      if (
        fieldRef.type === 'fieldRef' &&
        fieldRef.source === 'model' &&
        literalNode !== null
      ) {
        const fieldType = modelContext.fieldTypes.get(fieldRef.field);
        if (fieldType) {
          validateLiteralTypeCompatibility(
            fieldRef.field,
            fieldType,
            modelContext.modelName,
            literalNode,
          );
        }
      }
    },
    hasRole(node) {
      // Warn if role doesn't exist (but allow - plugins may define roles)
      if (allRoleNames.has(node.role)) {
        warnIfAutoAssignedRole(node.role, node.roleStart, node.roleEnd);
      } else {
        warnings.push({
          message: `Role '${node.role}' is not defined in the project configuration. Available roles: ${[...allRoleNames].join(', ')}.`,
          start: node.roleStart,
          end: node.roleEnd,
        });
      }
    },
    hasSomeRole(node) {
      for (let i = 0; i < node.roles.length; i++) {
        const role = node.roles[i];
        const start = node.rolesStart[i];
        const end = node.rolesEnd[i];
        if (allRoleNames.has(role)) {
          warnIfAutoAssignedRole(role, start, end);
        } else {
          warnings.push({
            message: `Role '${role}' is not defined in the project configuration. Available roles: ${[...allRoleNames].join(', ')}.`,
            start,
            end,
          });
        }
      }
    },
    nestedHasRole(node) {
      validateNestedRelation(
        node.relationName,
        node.relationStart,
        node.relationEnd,
        [node.role],
        [node.roleStart],
        [node.roleEnd],
      );
    },
    nestedHasSomeRole(node) {
      validateNestedRelation(
        node.relationName,
        node.relationStart,
        node.relationEnd,
        node.roles,
        node.rolesStart,
        node.rolesEnd,
      );
    },
    relationFilter(node) {
      validateRelationFilter(node);
    },
    isAuthenticated() {
      // No validation needed
    },
    binaryLogical(node, _ctx, visit) {
      visit(node.left);
      visit(node.right);
    },
  };

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

  function validateRelationFilter(
    node: Extract<AuthorizerExpressionNode, { type: 'relationFilter' }>,
  ): void {
    const { relationInfo } = modelContext;
    if (!relationInfo) {
      return;
    }

    const relation = relationInfo.get(node.relationName);
    if (!relation) {
      const availableRelations = [...relationInfo.keys()].join(', ');
      warnings.push({
        message: `Relation '${node.relationName}' does not exist on model '${modelContext.modelName}'.${availableRelations ? ` Available relations: ${availableRelations}.` : ''}`,
        start: node.relationStart,
        end: node.relationEnd,
      });
      return;
    }

    // exists()/all() only make sense on reverse (1:many) relations
    if (relation.direction === 'local') {
      warnings.push({
        message: `Relation '${node.relationName}' is a local (belongs-to) relation on model '${modelContext.modelName}'. exists()/all() require a reverse (has-many) relation.`,
        start: node.relationStart,
        end: node.relationEnd,
      });
      return;
    }

    // Validate condition fields exist on the foreign model
    for (const condition of node.conditions) {
      if (
        relation.foreignScalarFieldNames &&
        !relation.foreignScalarFieldNames.has(condition.field)
      ) {
        const availableFields = [...relation.foreignScalarFieldNames].join(
          ', ',
        );
        warnings.push({
          message: `Field '${condition.field}' does not exist on model '${relation.foreignModelName}'.${availableFields ? ` Available fields: ${availableFields}.` : ''}`,
          start: condition.fieldStart,
          end: condition.fieldEnd,
        });
      }

      // Validate field reference values (e.g., model.typo or invalid auth fields)
      if (condition.value.type === 'fieldRef') {
        validateFieldRef(condition.value);
      }

      // Type-check literal condition values against foreign field types
      if (
        condition.value.type === 'literalValue' &&
        relation.foreignFieldTypes
      ) {
        const foreignFieldType = relation.foreignFieldTypes.get(
          condition.field,
        );
        if (foreignFieldType) {
          validateLiteralTypeCompatibility(
            condition.field,
            foreignFieldType,
            relation.foreignModelName,
            condition.value,
          );
        }
      }
    }
  }

  function validateLiteralTypeCompatibility(
    fieldName: string,
    fieldType: string,
    modelName: string,
    literalNode: LiteralValueNode,
  ): void {
    const literalJsType = typeof literalNode.value;

    const isCompatible = (() => {
      switch (fieldType) {
        case 'boolean': {
          return literalJsType === 'boolean';
        }
        case 'int': {
          return (
            typeof literalNode.value === 'number' &&
            Number.isInteger(literalNode.value)
          );
        }
        case 'float':
        case 'decimal': {
          return literalJsType === 'number';
        }
        case 'string':
        case 'uuid':
        case 'enum': {
          return literalJsType === 'string';
        }
        default: {
          return true;
        }
      }
    })();

    if (!isCompatible) {
      warnings.push({
        message: `Literal value type '${literalJsType}' is not compatible with field '${fieldName}' of type '${fieldType}' on model '${modelName}'.`,
        start: literalNode.start,
        end: literalNode.end,
      });
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

  visitAuthorizerExpression(ast, validationVisitor);

  return warnings;
}

/**
 * Shape of a model for expression context building.
 * Uses structural typing so both raw JSON shapes and typed `ModelConfig` objects
 * can be passed directly.
 */
interface ExpressionContextModel {
  id?: string;
  name: string;
  authorizer?: { roles?: readonly { name: string }[] };
  /** Top-level fields (used by raw JSON shapes) */
  fields?: readonly { name: string; type?: string }[];
  model?: {
    /** Nested fields (used by typed ModelConfig objects) */
    fields?: readonly { name: string; type?: string }[];
    relations?: readonly {
      name: string;
      modelRef: string;
      foreignRelationName?: string;
      references?: readonly unknown[];
    }[];
  };
}

/**
 * Build authorizer role info (role names) from a model.
 */
function buildAuthorizerRoleNames(model: ExpressionContextModel): Set<string> {
  const names = new Set<string>();
  if (model.authorizer?.roles) {
    for (const role of model.authorizer.roles) {
      names.add(role.name);
    }
  }
  return names;
}

/**
 * Build scalar field info (names + types) from a model.
 */
function getModelFields(
  model: ExpressionContextModel,
): readonly { name: string; type?: string }[] {
  // Fields can be at top level (raw JSON) or nested under model (typed ModelConfig)
  return model.fields ?? model.model?.fields ?? [];
}

function buildFieldInfo(model: ExpressionContextModel): {
  foreignScalarFieldNames: Set<string> | undefined;
  foreignFieldTypes: Map<string, string> | undefined;
} {
  const fieldNames = new Set<string>();
  const fieldTypes = new Map<string, string>();
  for (const field of getModelFields(model)) {
    fieldNames.add(field.name);
    if (field.type) {
      fieldTypes.set(field.name, field.type);
    }
  }
  return {
    foreignScalarFieldNames: fieldNames.size > 0 ? fieldNames : undefined,
    foreignFieldTypes: fieldTypes.size > 0 ? fieldTypes : undefined,
  };
}

/**
 * Build complete model expression context from a model and all project models.
 *
 * This is the primary entry point for building validation and autocomplete context.
 * It discovers both local relations (FK on this model) and foreign/reverse relations
 * (FK on other models pointing to this model) for use with `hasRole()`, `exists()`, `all()`, etc.
 *
 * @param model - The current model (structural typing: works with both typed ModelConfig and raw JSON)
 * @param allModels - All models in the project
 * @returns Complete model validation context including all relations
 */
export function buildModelExpressionContext(
  model: ExpressionContextModel,
  allModels: readonly ExpressionContextModel[],
): ModelValidationContext {
  // Build scalar field info for the current model
  const scalarFieldNames = new Set<string>();
  const fieldTypes = new Map<string, string>();
  for (const field of getModelFields(model)) {
    scalarFieldNames.add(field.name);
    if (field.type) {
      fieldTypes.set(field.name, field.type);
    }
  }

  // Build lookups by both id and name for flexible matching
  const modelsById = new Map(
    allModels
      .filter((m): m is typeof m & { id: string } => m.id != null)
      .map((m) => [m.id, m]),
  );
  const modelsByName = new Map(allModels.map((m) => [m.name, m]));

  function lookupModel(ref: string): ExpressionContextModel | undefined {
    return modelsById.get(ref) ?? modelsByName.get(ref);
  }

  const relationInfo = new Map<string, RelationValidationInfo>();

  // 1. Local relations (FK on this model) — used by hasRole(model.relation, 'role')
  for (const relation of model.model?.relations ?? []) {
    const foreignModel = lookupModel(relation.modelRef);

    relationInfo.set(relation.name, {
      referenceCount: relation.references?.length ?? 0,
      foreignModelName: foreignModel?.name ?? relation.modelRef,
      foreignAuthorizerRoleNames: foreignModel
        ? buildAuthorizerRoleNames(foreignModel)
        : new Set(),
      ...(foreignModel ? buildFieldInfo(foreignModel) : {}),
      direction: 'local',
    });
  }

  // 2. Foreign/reverse relations (FK on other models pointing to this model)
  //    Used by exists(model.members, { ... }) and all(model.tasks, { ... })
  const currentModelId = model.id ?? model.name;
  for (const otherModel of allModels) {
    for (const rel of otherModel.model?.relations ?? []) {
      if (rel.modelRef !== currentModelId || !rel.foreignRelationName) {
        continue;
      }

      // Skip if a local relation already has this name
      if (relationInfo.has(rel.foreignRelationName)) {
        continue;
      }

      // For foreign relations, the "foreign model" (for field/role validation)
      // is the OTHER model that has the FK
      relationInfo.set(rel.foreignRelationName, {
        referenceCount: rel.references?.length ?? 0,
        foreignModelName: otherModel.name,
        foreignAuthorizerRoleNames: buildAuthorizerRoleNames(otherModel),
        ...buildFieldInfo(otherModel),
        direction: 'foreign',
      });
    }
  }

  return {
    modelName: model.name,
    scalarFieldNames,
    fieldTypes,
    relationInfo,
  };
}
