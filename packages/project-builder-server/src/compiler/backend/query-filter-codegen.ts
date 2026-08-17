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
  generateFieldRefOrLiteralCodeForSession,
  isGuaranteedAuthField,
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

/** Options for {@link generateQueryFilterExpressionCode}. */
export interface QueryFilterCodeOptions {
  /**
   * Render for the `r.userWhere` callback (`session.field`, no null-guard)
   * instead of `r.where` (`ctx.auth.field`, null-guarded). Only valid when the
   * node references `auth.userId` and no other auth field — callers must
   * check {@link referencesOnlyGuaranteedAuthField} first.
   */
  forSession?: boolean;
}

/**
 * Does this leaf node (a `fieldComparison` or `relationFilter` — the only
 * shapes the policy lowering's `asWhere` fallback receives) reference
 * `auth.userId` and no other auth field? If so, its null-guard collapses
 * under `r.userWhere`'s non-null guarantee.
 */
export function referencesOnlyGuaranteedAuthField(
  node: AuthorizerExpressionNode,
): boolean {
  const authFieldRefs: (FieldRefNode | LiteralValueNode)[] = [];
  if (node.type === 'fieldComparison') {
    if (node.left.type === 'fieldRef' && node.left.source === 'auth') {
      authFieldRefs.push(node.left);
    }
    if (node.right.type === 'fieldRef' && node.right.source === 'auth') {
      authFieldRefs.push(node.right);
    }
  } else if (node.type === 'relationFilter') {
    for (const condition of node.conditions) {
      if (
        condition.value.type === 'fieldRef' &&
        condition.value.source === 'auth'
      ) {
        authFieldRefs.push(condition.value);
      }
    }
  }
  return authFieldRefs.length > 0 && authFieldRefs.every(isGuaranteedAuthField);
}

/** Is this operand a reference to the auth context (`ctx.auth.*` once emitted)? */
function isAuthFieldRef(node: FieldRefNode | LiteralValueNode): boolean {
  return node.type === 'fieldRef' && node.source === 'auth';
}

/**
 * Does the emitted where clause read from the service context at all? `ctx` only
 * ever appears as `ctx.auth.*`, so a node with no auth reference compiles to a
 * closed-over constant and its callback can take no parameter.
 */
export function referencesAuthContext(node: AuthorizerExpressionNode): boolean {
  return visitAuthorizerExpression<boolean>(node, {
    fieldComparison: (n) => [n.left, n.right].some(isAuthFieldRef),
    hasRole: () => true,
    hasSomeRole: () => true,
    isAuthenticated: () => true,
    // No where form — these throw before any code is emitted.
    nestedHasRole: () => false,
    nestedHasSomeRole: () => false,
    relationFilter: (n) => n.conditions.some((c) => isAuthFieldRef(c.value)),
    binaryLogical: (n, _ctx, visit) => visit(n.left) || visit(n.right),
  });
}

/**
 * Build a visitor that emits Prisma where-clause code from AST nodes.
 *
 * NOTE: in the unified policy world this is only invoked on LEAF nodes the
 * lowering explicitly delegates (`!==` comparisons, relation filters). The
 * combinator/role cases (`binaryLogical`, `hasRole`) are kept here for
 * completeness / standalone use, but the lowering handles those itself.
 * `nestedHasRole`/`nestedHasSomeRole` have NO where form — they need a resolved
 * delegation link, so they throw rather than emit an unresolvable call.
 */
function createQueryFilterCodeVisitor(
  codeContext?: QueryFilterCodeContext,
  options?: QueryFilterCodeOptions,
): AuthorizerExpressionVisitor<string> {
  return {
    fieldComparison(node) {
      return generateFieldComparisonWhereCode(
        node.left,
        node.right,
        node.operator,
        options,
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
      // Delegation has no standalone where form — the policy lowering renders
      // these directly as `r.via`/`r.viaMany`, which need the resolved link
      // (FK keys, cardinality) this context doesn't carry.
      throw new Error(
        `nestedHasRole on relation '${node.relationName}' has no where form — it is lowered to r.via/r.viaMany by policy-lowering.`,
      );
    },
    nestedHasSomeRole(node) {
      throw new Error(
        `nestedHasSomeRole on relation '${node.relationName}' has no where form — it is lowered to r.via/r.viaMany by policy-lowering.`,
      );
    },
    relationFilter(node) {
      return generateRelationFilterWhereCode(node, options);
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
  options?: QueryFilterCodeOptions,
): string {
  return visitAuthorizerExpression(
    node,
    createQueryFilterCodeVisitor(codeContext, options),
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

/**
 * Prisma where for a relation filter: `some` → `{ rel: { some: {...} } }`,
 * `every` → `{ rel: { every: {...} } }`. Auth-field conditions get a null
 * guard, UNLESS `forSession` (every auth field in the filter is `userId`,
 * guaranteed non-null by `r.userWhere` — see `referencesOnlyGuaranteedAuthField`).
 */
function generateRelationFilterWhereCode(
  node: Extract<AuthorizerExpressionNode, { type: 'relationFilter' }>,
  options?: QueryFilterCodeOptions,
): string {
  const prismaOperator = node.operator === 'some' ? 'some' : 'every';
  const renderValue = options?.forSession
    ? generateFieldRefOrLiteralCodeForSession
    : generateFieldRefOrLiteralCode;

  const conditionEntries = node.conditions.map((condition) => {
    const valueCode = renderValue(condition.value);
    return `${condition.field}: ${valueCode}`;
  });
  const conditionsCode = conditionEntries.join(', ');

  const whereClause = `{ ${node.relationName}: { ${prismaOperator}: { ${conditionsCode} } } }`;

  if (options?.forSession) {
    return whereClause;
  }

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
 * - `forSession` (auth.x is `userId`, guaranteed non-null by `r.userWhere`):
 *   `model.field === userId` → `{ field: session.userId }` (no null-guard)
 */
function generateFieldComparisonWhereCode(
  left: FieldRefNode | LiteralValueNode,
  right: FieldRefNode | LiteralValueNode,
  operator: '===' | '!==',
  options?: QueryFilterCodeOptions,
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

  if (options?.forSession) {
    const sessionExpr = generateFieldRefOrLiteralCodeForSession(otherNode);
    if (operator === '!==') {
      return `{ ${modelNode.field}: { not: ${sessionExpr} } }`;
    }
    return `{ ${modelNode.field}: ${sessionExpr} }`;
  }

  const authExpr = `ctx.auth.${otherNode.field}`;
  if (operator === '!==') {
    return `(${authExpr} != null ? { ${modelNode.field}: { not: ${authExpr} } } : false)`;
  }
  return `(${authExpr} != null ? { ${modelNode.field}: ${authExpr} } : false)`;
}
