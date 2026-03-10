import type {
  AuthorizerExpressionNode,
  FieldRefNode,
  ModelConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { prismaModelQueryFilterGenerator } from '@baseplate-dev/fastify-generators';
import {
  ModelUtils,
  parseAuthorizerExpression,
} from '@baseplate-dev/project-builder-lib';
import { lowercaseFirstChar } from '@baseplate-dev/utils';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

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
  const authExpr = `ctx.auth.${authNode.field}`;
  return `(${authExpr} != null ? { ${modelNode.field}: ${authExpr} } : false)`;
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
      foreignQueryFilterRefs: [
        ...new Set(
          parsed.nestedRoleRefs
            .map(
              (ref) => resolvedFilters.get(ref.relationName)?.foreignModelName,
            )
            .filter((n): n is string => n != null),
        ),
      ],
      needsQueryHelpers: parsed.ast.type === 'binaryLogical',
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
