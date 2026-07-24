/**
 * Lowering from the authorizer expression AST to `createModelPolicy` role-tree
 * builder calls (`r.match(...)`, `r.via(...)`, `r.all([...])`, etc.).
 *
 * The role tree derives BOTH the boolean `check` and the Prisma `where` from one
 * declaration, so this replaces the old two-compiler split (a boolean-emitting
 * authorizer compiler + a where-emitting query-filter compiler).
 *
 * Node → kind mapping:
 * - `fieldComparison ===`  → `r.match({ field: value })` (scalar-equality fast path)
 * - `fieldComparison !==`  → `r.where(...)` (match is equality-only; where is the fallback)
 * - `hasRole` / `hasSomeRole` / `isAuthenticated` → `r.hasRole(...)` (global leaf)
 * - `nestedHasRole`        → `r.via(target, role, { fk, relation })`
 * - `nestedHasSomeRole`    → `r.some([ r.via(...), ... ])`
 * - `binaryLogical &&`     → `r.all([...])`
 * - `binaryLogical ||`     → `r.some([...])`
 * - `relationFilter`       → `r.where(...)` (membership stays where)
 *
 * Every node has a `where` form (the old query-filter compiler proved this), so
 * lowering can always fall back to `r.where` — the structured kinds are
 * optimizations layered on top, never a precondition.
 */

import type {
  AuthorizerExpressionNode,
  AuthorizerExpressionVisitor,
  FieldRefNode,
} from '@baseplate-dev/project-builder-lib';

import { visitAuthorizerExpression } from '@baseplate-dev/project-builder-lib';
import { quot } from '@baseplate-dev/utils';

import type { QueryFilterCodeContext } from './query-filter-codegen.js';

import { generateFieldRefOrLiteralCode } from './authorizer-expression-codegen-utils.js';
import { generateQueryFilterExpressionCode } from './query-filter-codegen.js';

/**
 * A resolved to-one delegation link (parent policy + FK/relation), for `r.via`.
 */
export interface ResolvedViaLink {
  /** The parent policy variable name (e.g., 'todoListPolicy'). */
  targetPolicyVar: string;
  /** The local FK field backing the relation (e.g., 'todoListId'). */
  fkFieldName: string;
  /** The relation field name (e.g., 'todoList'). */
  relationName: string;
}

/**
 * Context for lowering — resolved relation links for `via` delegation, and the
 * query-filter codegen context (for the `r.where` fallback paths).
 */
export interface PolicyLoweringContext {
  /** relation name → resolved `via` link. */
  resolvedVia: Map<string, ResolvedViaLink>;
  /**
   * The query-filter codegen context, used to render the `where` body for the
   * fallback kinds (`!==` comparisons, relation filters).
   */
  queryFilterContext?: QueryFilterCodeContext;
}

/** Is this comparison a scalar-equality that `r.match` can express? */
function isMatchable(node: AuthorizerExpressionNode): boolean {
  if (node.type !== 'fieldComparison') return false;
  if (node.operator !== '===') return false;
  // EXACTLY one side must be a model field; the other a literal or auth field.
  // A model-vs-model comparison (`model.a === model.b`) is not matchable — it
  // falls through to the where fallback, where `generateFieldComparisonWhereCode`
  // throws. `r.match` can only bind ONE model field to a scalar value.
  const sides = [node.left, node.right];
  const modelSides = sides.filter(
    (s): s is FieldRefNode => s.type === 'fieldRef' && s.source === 'model',
  );
  return modelSides.length === 1;
}

/**
 * Render the `{ field: value }` object body for a matchable comparison. If the
 * value is an auth field, guard it (`ctx.auth.x != null ? {...} : false`) so an
 * unauthenticated principal denies rather than matching everything.
 */
function renderMatchBody(node: AuthorizerExpressionNode): string {
  if (node.type !== 'fieldComparison') {
    throw new Error('renderMatchBody called on non-comparison node');
  }
  const modelSide = ([node.left, node.right] as (typeof node.left)[]).find(
    (s): s is FieldRefNode => s.type === 'fieldRef' && s.source === 'model',
  );
  const otherSide = node.left === modelSide ? node.right : node.left;
  if (!modelSide) {
    throw new Error('matchable comparison missing model field');
  }
  const { field } = modelSide;
  const value = generateFieldRefOrLiteralCode(otherSide);
  const objectBody = `{ ${field}: ${value} }`;

  // Auth-field value → null-guard so unauthenticated denies (never match-all).
  if (otherSide.type === 'fieldRef' && otherSide.source === 'auth') {
    return `(ctx) => (ctx.auth.${otherSide.field} != null ? ${objectBody} : false)`;
  }
  return `() => (${objectBody})`;
}

/**
 * Render an `r.via(targetPolicyVar, 'role', { fk: '...', relation: '...' })`
 * call. `targetPolicyVar` is an identifier (a variable reference), so it is
 * emitted bare; the role/fk/relation are string literals, so they are quoted.
 */
function renderVia(link: ResolvedViaLink, role: string): string {
  return `r.via(${link.targetPolicyVar}, ${quot(role)}, { fk: ${quot(
    link.fkFieldName,
  )}, relation: ${quot(link.relationName)} })`;
}

/**
 * Build the lowering visitor. Each node returns a `r.*(...)` builder-call string.
 */
function createPolicyLoweringVisitor(
  ctx: PolicyLoweringContext,
): AuthorizerExpressionVisitor<string> {
  /** Fallback: lower any node to `r.where` using the query-filter codegen. */
  const asWhere = (node: AuthorizerExpressionNode): string => {
    const whereBody = generateQueryFilterExpressionCode(
      node,
      ctx.queryFilterContext,
    );
    // The query-filter body is a `where`-returning expression; a leading `{`
    // needs parens to be a valid arrow body.
    const wrapped = whereBody.trimStart().startsWith('{')
      ? `(${whereBody})`
      : whereBody;
    return `r.where((ctx) => ${wrapped})`;
  };

  return {
    fieldComparison(node) {
      if (isMatchable(node)) {
        return `r.match(${renderMatchBody(node)})`;
      }
      // `!==` (or model-vs-model) → where fallback.
      return asWhere(node);
    },
    hasRole(node) {
      return `r.hasRole(${quot(node.role)})`;
    },
    hasSomeRole(node) {
      const roles = node.roles.map((r) => quot(r)).join(', ');
      return `r.hasRole(${roles})`;
    },
    isAuthenticated() {
      // "Any logged-in principal" — a dedicated runtime kind (check/where both
      // fold `ctx.auth.isAuthenticated`).
      return `r.authenticated()`;
    },
    nestedHasRole(node) {
      const link = ctx.resolvedVia.get(node.relationName);
      if (!link) {
        throw new Error(
          `No resolved via link for relation '${node.relationName}'`,
        );
      }
      return renderVia(link, node.role);
    },
    nestedHasSomeRole(node) {
      const link = ctx.resolvedVia.get(node.relationName);
      if (!link) {
        throw new Error(
          `No resolved via link for relation '${node.relationName}'`,
        );
      }
      const vias = node.roles.map((role) => renderVia(link, role));
      return vias.length === 1 ? vias[0] : `r.some([${vias.join(', ')}])`;
    },
    relationFilter(node) {
      // Membership (some/every) stays as `r.where`.
      return asWhere(node);
    },
    binaryLogical(node, _c, visit) {
      const parts = collectOperands(node, node.operator, visit);
      const combinator = node.operator === '&&' ? 'all' : 'some';
      return `r.${combinator}([${parts.join(', ')}])`;
    },
  };
}

/**
 * Flatten a same-operator `binaryLogical` chain into its operand strings, so
 * `A && B && C` becomes one `r.all([A, B, C])` rather than nested `r.all`s.
 */
function collectOperands(
  node: AuthorizerExpressionNode,
  operator: '&&' | '||',
  visit: (n: AuthorizerExpressionNode) => string,
): string[] {
  if (node.type === 'binaryLogical' && node.operator === operator) {
    return [
      ...collectOperands(node.left, operator, visit),
      ...collectOperands(node.right, operator, visit),
    ];
  }
  return [visit(node)];
}

/**
 * Lower an authorizer expression AST to a `createModelPolicy` role-tree builder
 * call string (e.g. `r.some([r.match(...), r.hasRole('admin')])`).
 */
export function lowerExpressionToRoleTree(
  node: AuthorizerExpressionNode,
  ctx: PolicyLoweringContext,
): string {
  return visitAuthorizerExpression(node, createPolicyLoweringVisitor(ctx));
}
