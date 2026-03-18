/**
 * Visitor pattern for traversing authorizer expression ASTs.
 *
 * Provides a type-safe way to implement operations over all expression
 * node types without writing switch statements. Each new operation
 * (code generation, validation, info extraction) implements the visitor
 * interface and is dispatched by `visitAuthorizerExpression`.
 */

import type {
  AuthorizerExpressionNode,
  BinaryLogicalNode,
  FieldComparisonNode,
  HasRoleNode,
  HasSomeRoleNode,
  IsAuthenticatedNode,
  NestedHasRoleNode,
  NestedHasSomeRoleNode,
  RelationFilterNode,
} from './authorizer-expression-ast.js';

/**
 * Visitor interface for authorizer expression AST nodes.
 *
 * Each method handles one node type and returns `TResult`.
 * The `binaryLogical` method receives a `visit` callback to
 * recursively process child nodes.
 *
 * @typeParam TResult - The return type of each visitor method
 * @typeParam TContext - Optional context passed to each method
 *
 * @example
 * ```typescript
 * const printer: AuthorizerExpressionVisitor<string> = {
 *   fieldComparison: (node) => `${node.left} ${node.operator} ${node.right}`,
 *   hasRole: (node) => `hasRole('${node.role}')`,
 *   // ...
 * };
 * const result = visitAuthorizerExpression(ast, printer);
 * ```
 */
export interface AuthorizerExpressionVisitor<TResult, TContext = undefined> {
  fieldComparison(node: FieldComparisonNode, ctx: TContext): TResult;
  hasRole(node: HasRoleNode, ctx: TContext): TResult;
  hasSomeRole(node: HasSomeRoleNode, ctx: TContext): TResult;
  nestedHasRole(node: NestedHasRoleNode, ctx: TContext): TResult;
  nestedHasSomeRole(node: NestedHasSomeRoleNode, ctx: TContext): TResult;
  relationFilter(node: RelationFilterNode, ctx: TContext): TResult;
  isAuthenticated(node: IsAuthenticatedNode, ctx: TContext): TResult;
  binaryLogical(
    node: BinaryLogicalNode,
    ctx: TContext,
    visit: (child: AuthorizerExpressionNode) => TResult,
  ): TResult;
}

/**
 * Walk an authorizer expression AST, dispatching each node to the
 * corresponding visitor method.
 *
 * The `binaryLogical` visitor method receives a bound `visit` callback
 * so it can recursively process `node.left` and `node.right` without
 * needing direct access to the walker.
 *
 * @param node - The AST node to visit
 * @param visitor - The visitor implementation
 * @param ctx - Context passed to every visitor method
 * @returns The result of visiting the root node
 */
export function visitAuthorizerExpression<TResult, TContext = undefined>(
  node: AuthorizerExpressionNode,
  visitor: AuthorizerExpressionVisitor<TResult, TContext>,
  ...args: TContext extends undefined ? [] : [ctx: TContext]
): TResult {
  const ctx = args[0] as TContext;
  const visit = (child: AuthorizerExpressionNode): TResult =>
    visitAuthorizerExpression(child, visitor, ...args);

  switch (node.type) {
    case 'fieldComparison': {
      return visitor.fieldComparison(node, ctx);
    }
    case 'hasRole': {
      return visitor.hasRole(node, ctx);
    }
    case 'hasSomeRole': {
      return visitor.hasSomeRole(node, ctx);
    }
    case 'nestedHasRole': {
      return visitor.nestedHasRole(node, ctx);
    }
    case 'nestedHasSomeRole': {
      return visitor.nestedHasSomeRole(node, ctx);
    }
    case 'relationFilter': {
      return visitor.relationFilter(node, ctx);
    }
    case 'isAuthenticated': {
      return visitor.isAuthenticated(node, ctx);
    }
    case 'binaryLogical': {
      return visitor.binaryLogical(node, ctx, visit);
    }
  }
}
