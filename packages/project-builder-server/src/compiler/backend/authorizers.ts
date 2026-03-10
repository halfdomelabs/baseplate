import type {
  AuthorizerExpressionNode,
  FieldRefNode,
  ModelConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  prismaModelAuthorizerGenerator,
  prismaModelQueryFilterGenerator,
} from '@baseplate-dev/fastify-generators';
import {
  ModelUtils,
  parseAuthorizerExpression,
} from '@baseplate-dev/project-builder-lib';
import { lowercaseFirstChar } from '@baseplate-dev/utils';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

/**
 * Resolved information about a relation for nested authorizer code generation.
 */
interface ResolvedNestedRelation {
  /** The local FK field name (e.g., 'todoListId') */
  localFkFieldName: string;
  /** The foreign model name (e.g., 'TodoList') */
  foreignModelName: string;
  /** The foreign authorizer variable name (e.g., 'todoListAuthorizer') */
  foreignAuthorizerVar: string;
}

/**
 * Context for generating authorizer expression code with relation resolution.
 */
interface AuthorizerExpressionCodeContext {
  /** Map of relation name → resolved nested relation info */
  resolvedRelations: Map<string, ResolvedNestedRelation>;
}

/**
 * Resolved information about a relation for nested query filter code generation.
 */
interface ResolvedNestedQueryFilter {
  /** The Prisma relation field name (e.g., 'todoList') */
  relationFieldName: string;
  /** The foreign model name (e.g., 'TodoList') */
  foreignModelName: string;
  /** The foreign query filter variable name (e.g., 'todoListQueryFilter') */
  foreignQueryFilterVar: string;
}

/**
 * Context for generating query filter expression code with relation resolution.
 */
interface QueryFilterCodeContext {
  /** Map of relation name → resolved nested query filter info */
  resolvedFilters: Map<string, ResolvedNestedQueryFilter>;
}

/**
 * Generate TypeScript code from an authorizer expression AST node.
 *
 * Transforms the implicit-context DSL into explicit context code:
 * - `model.field` stays as `model.field`
 * - `userId` (auth field) becomes `ctx.auth.userId`
 * - `hasRole('admin')` becomes `ctx.auth.hasRole('admin')`
 * - `hasSomeRole(['a', 'b'])` becomes `ctx.auth.hasSomeRole(['a', 'b'])`
 * - `hasRole(model.relation, 'role')` becomes `await foreignAuthorizer.hasRoleById(ctx, model.fkField, 'role')`
 * - `A || B` becomes `(A) || (B)`
 */
export function generateAuthorizerExpressionCode(
  node: AuthorizerExpressionNode,
  codeContext?: AuthorizerExpressionCodeContext,
): string {
  switch (node.type) {
    case 'fieldComparison': {
      const left = generateFieldRefCode(node.left);
      const right = generateFieldRefCode(node.right);
      return `${left} ${node.operator} ${right}`;
    }
    case 'hasRole': {
      return `ctx.auth.hasRole('${node.role}')`;
    }
    case 'hasSomeRole': {
      const roles = node.roles.map((r: string) => `'${r}'`).join(', ');
      return `ctx.auth.hasSomeRole([${roles}])`;
    }
    case 'nestedHasRole': {
      const resolved = getResolvedRelation(codeContext, node.relationName);
      return `await ${resolved.foreignAuthorizerVar}.hasRoleById(ctx, model.${resolved.localFkFieldName}, '${node.role}')`;
    }
    case 'nestedHasSomeRole': {
      const resolved = getResolvedRelation(codeContext, node.relationName);
      // Generate individual hasRoleById calls joined with ||
      const checks = node.roles.map(
        (role) =>
          `await ${resolved.foreignAuthorizerVar}.hasRoleById(ctx, model.${resolved.localFkFieldName}, '${role}')`,
      );
      return checks.length === 1 ? checks[0] : `(${checks.join(' || ')})`;
    }
    case 'isAuthenticated': {
      return 'ctx.auth.isAuthenticated';
    }
    case 'binaryLogical': {
      const left = generateAuthorizerExpressionCode(node.left, codeContext);
      const right = generateAuthorizerExpressionCode(node.right, codeContext);
      return `(${left}) ${node.operator} (${right})`;
    }
  }
}

/**
 * Get the resolved relation info from the code context, throwing if not found.
 */
function getResolvedRelation(
  codeContext: AuthorizerExpressionCodeContext | undefined,
  relationName: string,
): ResolvedNestedRelation {
  if (!codeContext) {
    throw new Error(
      `Nested authorizer expression references relation '${relationName}' but no code context was provided`,
    );
  }
  const resolved = codeContext.resolvedRelations.get(relationName);
  if (!resolved) {
    throw new Error(
      `Nested authorizer expression references relation '${relationName}' which was not resolved`,
    );
  }
  return resolved;
}

/**
 * Get the resolved query filter info from the code context, throwing if not found.
 */
function getResolvedQueryFilter(
  codeContext: QueryFilterCodeContext | undefined,
  relationName: string,
): ResolvedNestedQueryFilter {
  if (!codeContext) {
    throw new Error(
      `Nested query filter expression references relation '${relationName}' but no code context was provided`,
    );
  }
  const resolved = codeContext.resolvedFilters.get(relationName);
  if (!resolved) {
    throw new Error(
      `Nested query filter expression references relation '${relationName}' which was not resolved`,
    );
  }
  return resolved;
}

function generateFieldRefCode(node: FieldRefNode): string {
  if (node.source === 'model') {
    return `model.${node.field}`;
  }
  return `ctx.auth.${node.field}`;
}

/**
 * Resolve relation info for nested authorizer expressions on a model.
 */
function resolveNestedRelations(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  nestedRoleRefs: { relationName: string; roles: string[] }[],
): {
  resolvedRelations: Map<string, ResolvedNestedRelation>;
  foreignModelNames: string[];
} {
  const resolvedRelations = new Map<string, ResolvedNestedRelation>();
  const foreignModelNames: string[] = [];

  for (const { relationName } of nestedRoleRefs) {
    if (resolvedRelations.has(relationName)) {
      continue;
    }

    const relation = model.model.relations.find((r) => r.name === relationName);
    if (!relation) {
      throw new Error(
        `Relation '${relationName}' not found on model '${model.name}'`,
      );
    }

    if (relation.references.length !== 1) {
      throw new Error(
        `Relation '${relationName}' on model '${model.name}' has ${relation.references.length} foreign key references. Nested authorizer checks only support single-key relations.`,
      );
    }

    const localFkFieldName = appBuilder.nameFromId(
      relation.references[0].localRef,
    );
    if (!localFkFieldName) {
      throw new Error(
        `Could not resolve local FK field for relation '${relationName}' on model '${model.name}'`,
      );
    }

    const foreignModel = ModelUtils.byIdOrThrow(
      appBuilder.projectDefinition,
      relation.modelRef,
    );
    const foreignModelName = foreignModel.name;
    const foreignAuthorizerVar = `${lowercaseFirstChar(foreignModelName)}Authorizer`;

    resolvedRelations.set(relationName, {
      localFkFieldName,
      foreignModelName,
      foreignAuthorizerVar,
    });

    if (!foreignModelNames.includes(foreignModelName)) {
      foreignModelNames.push(foreignModelName);
    }
  }

  return { resolvedRelations, foreignModelNames };
}

/**
 * Resolve relation info for nested query filter expressions on a model.
 * Unlike authorizer resolution which needs the local FK field, query filters
 * need the Prisma relation field name for nested where clauses.
 */
function resolveNestedQueryFilters(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  nestedRoleRefs: { relationName: string; roles: string[] }[],
): {
  resolvedFilters: Map<string, ResolvedNestedQueryFilter>;
  foreignModelNames: string[];
} {
  const resolvedFilters = new Map<string, ResolvedNestedQueryFilter>();
  const foreignModelNames: string[] = [];

  for (const { relationName } of nestedRoleRefs) {
    if (resolvedFilters.has(relationName)) {
      continue;
    }

    const relation = model.model.relations.find((r) => r.name === relationName);
    if (!relation) {
      throw new Error(
        `Relation '${relationName}' not found on model '${model.name}'`,
      );
    }

    const foreignModel = ModelUtils.byIdOrThrow(
      appBuilder.projectDefinition,
      relation.modelRef,
    );
    const foreignModelName = foreignModel.name;
    const foreignQueryFilterVar = `${lowercaseFirstChar(foreignModelName)}QueryFilter`;

    resolvedFilters.set(relationName, {
      relationFieldName: relationName,
      foreignModelName,
      foreignQueryFilterVar,
    });

    if (!foreignModelNames.includes(foreignModelName)) {
      foreignModelNames.push(foreignModelName);
    }
  }

  return { resolvedFilters, foreignModelNames };
}

/**
 * Build model authorizer generators for all models in a feature
 * that have non-empty authorizer roles.
 */
export function buildAuthorizersForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): GeneratorBundle[] {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  );

  return models
    .filter((model) => model.authorizer.roles.length > 0)
    .map((model) => {
      const { authorizer } = model;

      const primaryKeyFields = ModelUtils.getPrimaryKeyFields(model);
      if (primaryKeyFields.length !== 1) {
        throw new Error(
          `Model '${model.name}' must have exactly one primary key field to use model authorizer. Found ${primaryKeyFields.length}.`,
        );
      }
      const idFieldName = primaryKeyFields[0].name;

      // Collect all nested role refs across all roles for this model
      const allNestedRoleRefs: { relationName: string; roles: string[] }[] = [];
      const parsedRoles = authorizer.roles.map((role) => {
        const parsed = parseAuthorizerExpression(role.expression);
        allNestedRoleRefs.push(...parsed.nestedRoleRefs);
        return { role, parsed };
      });

      // Resolve relation info if there are nested refs
      const { resolvedRelations, foreignModelNames } =
        allNestedRoleRefs.length > 0
          ? resolveNestedRelations(appBuilder, model, allNestedRoleRefs)
          : { resolvedRelations: new Map(), foreignModelNames: [] };

      const codeContext: AuthorizerExpressionCodeContext | undefined =
        resolvedRelations.size > 0 ? { resolvedRelations } : undefined;

      return prismaModelAuthorizerGenerator({
        modelName: model.name,
        idFieldName,
        foreignAuthorizerModelNames: foreignModelNames,
        roles: parsedRoles.map(({ role, parsed }) => {
          const hasNestedRefs = parsed.nestedRoleRefs.length > 0;
          const expressionCode = generateAuthorizerExpressionCode(
            parsed.ast,
            codeContext,
          );

          let roleCode: string;
          if (hasNestedRefs) {
            // Nested refs are async (hasRoleById returns Promise)
            roleCode = parsed.requiresModel
              ? `async (ctx, model) => ${expressionCode}`
              : `async (ctx) => ${expressionCode}`;
          } else {
            roleCode = parsed.requiresModel
              ? `(ctx, model) => ${expressionCode}`
              : `(ctx) => ${expressionCode}`;
          }

          return {
            name: role.name,
            roleCode,
          };
        }),
      });
    });
}

// ── Query filter expression compiler ────────────────────────────────

/**
 * Generate TypeScript code from an authorizer expression AST node,
 * producing a Prisma where clause instead of a boolean check.
 *
 * - `model.field === userId` → `{ field: ctx.auth.userId }`
 * - `hasRole('admin')` → `ctx.auth.hasRole('admin')` (boolean → true/false)
 * - `hasSomeRole([...])` → `ctx.auth.hasSomeRole([...])` (boolean)
 * - `A || B` → `queryHelpers.or([A, B])`
 * - `A && B` → `queryHelpers.and([A, B])`
 */
export function generateQueryFilterExpressionCode(
  node: AuthorizerExpressionNode,
  codeContext?: QueryFilterCodeContext,
): string {
  switch (node.type) {
    case 'fieldComparison': {
      return generateFieldComparisonWhereCode(node.left, node.right);
    }
    case 'hasRole': {
      return `ctx.auth.hasRole('${node.role}')`;
    }
    case 'hasSomeRole': {
      const roles = node.roles.map((r: string) => `'${r}'`).join(', ');
      return `ctx.auth.hasSomeRole([${roles}])`;
    }
    case 'isAuthenticated': {
      return 'ctx.auth.isAuthenticated';
    }
    case 'nestedHasRole': {
      const resolved = getResolvedQueryFilter(codeContext, node.relationName);
      const roles = `'${node.role}'`;
      return `${resolved.foreignQueryFilterVar}.buildNestedWhere(ctx, '${resolved.relationFieldName}', [${roles}])`;
    }
    case 'nestedHasSomeRole': {
      const resolved = getResolvedQueryFilter(codeContext, node.relationName);
      const roles = node.roles.map((r) => `'${r}'`).join(', ');
      return `${resolved.foreignQueryFilterVar}.buildNestedWhere(ctx, '${resolved.relationFieldName}', [${roles}])`;
    }
    case 'binaryLogical': {
      const left = generateQueryFilterExpressionCode(node.left, codeContext);
      const right = generateQueryFilterExpressionCode(node.right, codeContext);
      const helper = node.operator === '||' ? 'or' : 'and';
      return `queryHelpers.${helper}([${left}, ${right}])`;
    }
  }
}

/**
 * Generate a Prisma where clause from a field comparison.
 *
 * In a field comparison one side is always a model field and the other
 * is an auth field. We produce `{ modelField: ctx.auth.authField }`.
 */
function generateFieldComparisonWhereCode(
  left: FieldRefNode,
  right: FieldRefNode,
): string {
  const modelNode = left.source === 'model' ? left : right;
  const authNode = left.source === 'auth' ? left : right;
  return `{ ${modelNode.field}: ctx.auth.${authNode.field} }`;
}

/**
 * Build a query filter generator for a single model given its roles and
 * optional foreign query filter model names.
 */
function buildQueryFilterForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  roleRefs: string[],
): {
  bundle: GeneratorBundle;
  foreignModelNames: string[];
} {
  const { authorizer } = model;

  // Collect all nested role refs across all referenced roles
  const allNestedRoleRefs: { relationName: string; roles: string[] }[] = [];
  const parsedRoles = roleRefs.map((roleRef) => {
    const authRole = authorizer.roles.find(
      (r) => r.id === roleRef || r.name === roleRef,
    );
    if (!authRole) {
      throw new Error(
        `Instance role '${roleRef}' not found in model '${model.name}' authorizer roles.`,
      );
    }

    const parsed = parseAuthorizerExpression(authRole.expression);
    allNestedRoleRefs.push(...parsed.nestedRoleRefs);
    return { authRole, parsed };
  });

  // Resolve relation info if there are nested refs
  const { resolvedFilters, foreignModelNames } =
    allNestedRoleRefs.length > 0
      ? resolveNestedQueryFilters(appBuilder, model, allNestedRoleRefs)
      : {
          resolvedFilters: new Map<string, ResolvedNestedQueryFilter>(),
          foreignModelNames: [],
        };

  const codeContext: QueryFilterCodeContext | undefined =
    resolvedFilters.size > 0 ? { resolvedFilters } : undefined;

  const roles = parsedRoles.map(({ authRole, parsed }) => {
    const expressionCode = generateQueryFilterExpressionCode(
      parsed.ast,
      codeContext,
    );

    // Wrap object literals in parens to avoid arrow function body ambiguity
    const wrappedCode = expressionCode.startsWith('{')
      ? `(${expressionCode})`
      : expressionCode;

    return {
      name: authRole.name,
      roleCode: `(ctx) => ${wrappedCode}`,
    };
  });

  return {
    bundle: prismaModelQueryFilterGenerator({
      modelName: model.name,
      foreignQueryFilterModelNames: foreignModelNames,
      roles,
    }),
    foreignModelNames,
  };
}

/**
 * Build model query filter generators for all models in a feature
 * that have authorizer roles. Every model with authorizer roles gets a query
 * filter so it can be referenced by nested expressions from other models.
 */
export function buildQueryFiltersForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): GeneratorBundle[] {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  );

  return models
    .filter((model) => model.authorizer.roles.length > 0)
    .map((model) => {
      const roleRefs = model.authorizer.roles.map((r) => r.name);
      const { bundle } = buildQueryFilterForModel(appBuilder, model, roleRefs);
      return bundle;
    });
}
