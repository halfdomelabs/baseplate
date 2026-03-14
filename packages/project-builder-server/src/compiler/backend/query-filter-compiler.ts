import type {
  AuthorizerExpressionNode,
  FieldRefNode,
  LiteralValueNode,
  ModelConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { prismaModelQueryFilterGenerator } from '@baseplate-dev/fastify-generators';
import {
  ModelUtils,
  parseAuthorizerExpression,
} from '@baseplate-dev/project-builder-lib';
import { lowercaseFirstChar, quot } from '@baseplate-dev/utils';

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
      return generateFieldComparisonWhereCode(
        node.left,
        node.right,
        node.operator,
      );
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
    case 'relationFilter': {
      return generateRelationFilterWhereCode(node);
    }
    case 'binaryLogical': {
      const helper = node.operator === '||' ? 'or' : 'and';
      // Flatten consecutive same-operator chains so A && B && C becomes
      // queryHelpers.and([A, B, C]) instead of queryHelpers.and([queryHelpers.and([A, B]), C])
      const operands = collectLogicalOperands(node, node.operator);
      const operandCode = operands
        .map((operand) =>
          generateQueryFilterExpressionCode(operand, codeContext),
        )
        .join(', ');
      return `queryHelpers.${helper}([${operandCode}])`;
    }
  }
}

/**
 * Collect all operands from a chain of the same logical operator.
 *
 * For A && (B && C), the AST is `&&(A, &&(B, C))`. This flattens it to [A, B, C]
 * so we can emit a single `queryHelpers.and([A, B, C])` call.
 * Mixed operators (A && B || C) are NOT flattened — the differing operator acts
 * as a boundary and is emitted as a nested call.
 */
function collectLogicalOperands(
  node: AuthorizerExpressionNode,
  operator: '||' | '&&',
): AuthorizerExpressionNode[] {
  if (node.type !== 'binaryLogical' || node.operator !== operator) {
    return [node];
  }
  return [
    ...collectLogicalOperands(node.left, operator),
    ...collectLogicalOperands(node.right, operator),
  ];
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
 * Generate a Prisma where clause for a relation filter expression (exists/all).
 *
 * For `exists` (some): `{ relationName: { some: { ...conditions } } }`
 * For `all` (every): `{ relationName: { every: { ...conditions } } }`
 */
function generateRelationFilterWhereCode(
  node: Extract<AuthorizerExpressionNode, { type: 'relationFilter' }>,
): string {
  const prismaOperator = node.operator === 'some' ? 'some' : 'every';

  // Build condition entries
  const conditionEntries = node.conditions.map((condition) => {
    const valueCode = generateConditionValueCode(condition.value);
    return `${condition.field}: ${valueCode}`;
  });
  const conditionsCode = conditionEntries.join(', ');

  const whereClause = `{ ${node.relationName}: { ${prismaOperator}: { ${conditionsCode} } } }`;

  // Check if any condition references an auth field (needs null guard)
  const authFieldConditions = node.conditions.filter(
    (c) => c.value.type === 'fieldRef' && c.value.source === 'auth',
  );

  if (authFieldConditions.length > 0) {
    const nullChecks = authFieldConditions
      .map((c) => `${generateConditionValueCode(c.value)} != null`)
      .join(' && ');
    return `(${nullChecks} ? ${whereClause} : false)`;
  }

  return whereClause;
}

/**
 * Generate code for a condition value (auth field ref or literal).
 */
function generateConditionValueCode(
  node: FieldRefNode | LiteralValueNode,
): string {
  if (node.type === 'literalValue') {
    return serializeLiteralValue(node.value);
  }
  if (node.source === 'auth') {
    return `ctx.auth.${node.field}`;
  }
  return `model.${node.field}`;
}

/**
 * Serialize a literal value as a TypeScript literal string.
 */
function serializeLiteralValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    return quot(value);
  }
  return String(value);
}

/**
 * Generate a Prisma where clause from a field comparison.
 *
 * Handles three cases:
 * - model.field === literal → `{ field: literal }`
 * - model.field !== literal → `{ field: { not: literal } }`
 * - model.field === auth.userId → `(authExpr != null ? { field: authExpr } : false)`
 * - model.field !== auth.userId → `(authExpr != null ? { field: { not: authExpr } } : false)`
 */
function generateFieldComparisonWhereCode(
  left: FieldRefNode | LiteralValueNode,
  right: FieldRefNode | LiteralValueNode,
  operator: '===' | '!==',
): string {
  // Identify which side is the model field
  const modelNode =
    left.type === 'fieldRef' && left.source === 'model'
      ? left
      : right.type === 'fieldRef' && right.source === 'model'
        ? right
        : null;

  if (!modelNode) {
    throw new Error(
      'Field comparison must have at least one model field reference for query filter generation.',
    );
  }

  const otherNode = left === modelNode ? right : left;

  if (otherNode.type === 'literalValue') {
    // Static literal comparison
    const serialized = serializeLiteralValue(otherNode.value);
    if (operator === '!==') {
      return `{ ${modelNode.field}: { not: ${serialized} } }`;
    }
    return `{ ${modelNode.field}: ${serialized} }`;
  }

  // Auth field comparison — guard against model-vs-model (not supported)
  if (otherNode.source !== 'auth') {
    throw new Error(
      'Field comparison must compare a model field against an auth field or a literal value for query filter generation.',
    );
  }
  const authExpr = `ctx.auth.${otherNode.field}`;
  if (operator === '!==') {
    return `(${authExpr} != null ? { ${modelNode.field}: { not: ${authExpr} } } : false)`;
  }
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
