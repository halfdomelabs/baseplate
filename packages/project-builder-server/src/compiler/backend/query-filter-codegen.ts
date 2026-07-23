/**
 * Codegen for the Prisma `where`-clause form of authorizer expressions.
 *
 * This is the `r.where` fallback used by the policy lowering
 * (`policy-lowering.ts`) for nodes that don't map to a structured role kind —
 * chiefly `!==` comparisons and relation-membership filters. Every AST node has
 * a where form, so this guarantees the lowering can always fall back.
 *
 * Extracted from the former query-filter compiler; the two-factory split is
 * gone, but the per-node where rendering is still needed as the escape hatch.
 */

import type {
  AuthorizerExpressionNode,
  AuthorizerExpressionVisitor,
  FieldRefNode,
  LiteralValueNode,
} from '@baseplate-dev/project-builder-lib';

import { visitAuthorizerExpression } from '@baseplate-dev/project-builder-lib';
import { quot } from '@baseplate-dev/utils';

import {
  generateFieldRefOrLiteralCode,
  serializeLiteralValue,
} from './authorizer-expression-codegen-utils.js';

/** Resolved relation info for a nested query filter (`buildNestedWhere`). */
export interface ResolvedNestedQueryFilter {
  /** The Prisma relation field name (e.g., 'todoList'). */
  relationFieldName: string;
  /** The foreign model name (e.g., 'TodoList'). */
  foreignModelName: string;
  /** The foreign query filter variable name (e.g., 'todoListQueryFilter'). */
  foreignQueryFilterVar: string;
}

/** Context for where-clause codegen with relation resolution. */
export interface QueryFilterCodeContext {
  /** relation name → resolved nested query filter info. */
  resolvedFilters: Map<string, ResolvedNestedQueryFilter>;
}

/**
 * Build a visitor that emits Prisma where-clause code from AST nodes.
 *
 * NOTE: in the unified policy world this is only invoked on LEAF nodes the
 * lowering explicitly delegates (`!==` comparisons, relation filters). The
 * combinator/role cases (`binaryLogical`, `hasRole`, `nestedHasRole`) are kept
 * here for completeness / standalone use, but the lowering handles those itself.
 */
function createQueryFilterCodeVisitor(
  codeContext?: QueryFilterCodeContext,
): AuthorizerExpressionVisitor<string> {
  return {
    fieldComparison(node) {
      return generateFieldComparisonWhereCode(
        node.left,
        node.right,
        node.operator,
      );
    },
    hasRole(node) {
      return `ctx.auth.hasRole(${quot(node.role)})`;
    },
    hasSomeRole(node) {
      const roles = node.roles.map((r: string) => quot(r)).join(', ');
      return `ctx.auth.hasSomeRole([${roles}])`;
    },
    isAuthenticated() {
      return 'ctx.auth.isAuthenticated';
    },
    nestedHasRole(node) {
      const resolved = getResolvedQueryFilter(codeContext, node.relationName);
      return `${resolved.foreignQueryFilterVar}.buildNestedWhere(ctx, ${quot(
        resolved.relationFieldName,
      )}, [${quot(node.role)}])`;
    },
    nestedHasSomeRole(node) {
      const resolved = getResolvedQueryFilter(codeContext, node.relationName);
      const roles = node.roles.map((r) => quot(r)).join(', ');
      return `${resolved.foreignQueryFilterVar}.buildNestedWhere(ctx, ${quot(
        resolved.relationFieldName,
      )}, [${roles}])`;
    },
    relationFilter(node) {
      return generateRelationFilterWhereCode(node);
    },
    binaryLogical(node, _ctx, visit) {
      const helper = node.operator === '||' ? 'or' : 'and';
      const operands = collectLogicalOperands(node, node.operator);
      const operandCode = operands.map((operand) => visit(operand)).join(', ');
      return `queryHelpers.${helper}([${operandCode}])`;
    },
  };
}

/**
 * Render the Prisma where-clause form of an authorizer expression AST node.
 */
export function generateQueryFilterExpressionCode(
  node: AuthorizerExpressionNode,
  codeContext?: QueryFilterCodeContext,
): string {
  return visitAuthorizerExpression(
    node,
    createQueryFilterCodeVisitor(codeContext),
  );
}

/**
 * Flatten a same-operator `binaryLogical` chain: `A && (B && C)` → `[A, B, C]`.
 * Mixed operators act as a boundary and are emitted as a nested call.
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

function getResolvedQueryFilter(
  codeContext: QueryFilterCodeContext | undefined,
  relationName: string,
): ResolvedNestedQueryFilter {
  if (!codeContext) {
    throw new Error(
      `Nested query filter references relation '${relationName}' but no code context was provided`,
    );
  }
  const resolved = codeContext.resolvedFilters.get(relationName);
  if (!resolved) {
    throw new Error(
      `Nested query filter references relation '${relationName}' which was not resolved`,
    );
  }
  return resolved;
}

/**
 * Prisma where for a relation filter: `some` → `{ rel: { some: {...} } }`,
 * `every` → `{ rel: { every: {...} } }`. Auth-field conditions get a null guard.
 */
function generateRelationFilterWhereCode(
  node: Extract<AuthorizerExpressionNode, { type: 'relationFilter' }>,
): string {
  const prismaOperator = node.operator === 'some' ? 'some' : 'every';

  const conditionEntries = node.conditions.map((condition) => {
    const valueCode = generateFieldRefOrLiteralCode(condition.value);
    return `${condition.field}: ${valueCode}`;
  });
  const conditionsCode = conditionEntries.join(', ');

  const whereClause = `{ ${node.relationName}: { ${prismaOperator}: { ${conditionsCode} } } }`;

  const authFieldConditions = node.conditions.filter(
    (c) => c.value.type === 'fieldRef' && c.value.source === 'auth',
  );

  if (authFieldConditions.length > 0) {
    const nullChecks = authFieldConditions
      .map((c) => `${generateFieldRefOrLiteralCode(c.value)} != null`)
      .join(' && ');
    return `(${nullChecks} ? ${whereClause} : false)`;
  }

  return whereClause;
}

/**
 * Prisma where for a field comparison:
 * - `model.field === literal` → `{ field: literal }`
 * - `model.field !== literal` → `{ field: { not: literal } }`
 * - `model.field === auth.x`  → `(ctx.auth.x != null ? { field: ctx.auth.x } : false)`
 * - `model.field !== auth.x`  → `(ctx.auth.x != null ? { field: { not: ctx.auth.x } } : false)`
 */
function generateFieldComparisonWhereCode(
  left: FieldRefNode | LiteralValueNode,
  right: FieldRefNode | LiteralValueNode,
  operator: '===' | '!==',
): string {
  const modelNode =
    left.type === 'fieldRef' && left.source === 'model'
      ? left
      : right.type === 'fieldRef' && right.source === 'model'
        ? right
        : null;

  if (!modelNode) {
    throw new Error(
      'Field comparison must have at least one model field reference for where generation.',
    );
  }

  const otherNode = left === modelNode ? right : left;

  if (otherNode.type === 'literalValue') {
    const serialized = serializeLiteralValue(otherNode.value);
    if (operator === '!==') {
      return `{ ${modelNode.field}: { not: ${serialized} } }`;
    }
    return `{ ${modelNode.field}: ${serialized} }`;
  }

  if (otherNode.source !== 'auth') {
    throw new Error(
      'Field comparison must compare a model field against an auth field or a literal value.',
    );
  }
  const authExpr = `ctx.auth.${otherNode.field}`;
  if (operator === '!==') {
    return `(${authExpr} != null ? { ${modelNode.field}: { not: ${authExpr} } } : false)`;
  }
  return `(${authExpr} != null ? { ${modelNode.field}: ${authExpr} } : false)`;
}
