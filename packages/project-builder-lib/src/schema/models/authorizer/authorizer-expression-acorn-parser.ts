/**
 * Parser for authorizer expressions using Acorn.
 *
 * Parses expressions like:
 * - `model.id === auth.userId`
 * - `auth.hasRole('admin')`
 * - `model.id === auth.userId || auth.hasRole('admin')`
 *
 * Uses Acorn to parse as JavaScript, then converts the ESTree AST
 * to our domain-specific AST, rejecting unsupported constructs.
 */

import type {
  BinaryExpression,
  CallExpression,
  Expression,
  LogicalExpression,
  Program,
} from 'acorn';

import { parse } from 'acorn';

import type {
  AuthorizerExpressionInfo,
  AuthorizerExpressionNode,
  BinaryLogicalNode,
  FieldComparisonNode,
  FieldRefNode,
  HasRoleNode,
} from './authorizer-expression-ast.js';

import { AuthorizerExpressionParseError } from './authorizer-expression-ast.js';

/**
 * Parse an authorizer expression string into our domain AST.
 *
 * @param input - The expression string to parse
 * @returns The parsed expression info including AST and dependencies
 * @throws {AuthorizerExpressionParseError} If the expression is invalid
 *
 * @example
 * ```typescript
 * const result = parseAuthorizerExpression("model.id === auth.userId");
 * // result.ast = { type: 'fieldComparison', ... }
 * // result.modelFieldRefs = ['id']
 * // result.authFieldRefs = ['userId']
 * ```
 */
export function parseAuthorizerExpression(
  input: string,
): AuthorizerExpressionInfo {
  // Parse with Acorn
  let program: Program;
  try {
    program = parse(input, {
      ecmaVersion: 2020,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AuthorizerExpressionParseError(
        `Invalid expression syntax: ${error.message}`,
        // SyntaxError thrown by Acorn have a pos property
        (error as unknown as { pos: number }).pos,
      );
    }
    throw error;
  }

  // Check body is an expression
  if (program.body.length !== 1) {
    throw new AuthorizerExpressionParseError(
      'Expression must be a single expression statement, e.g. model.id === auth.userId',
      0,
      input.length,
    );
  }
  const expressionStatement = program.body[0];

  if (expressionStatement.type !== 'ExpressionStatement') {
    throw new AuthorizerExpressionParseError(
      'Line must be an expression statement, e.g. model.id === auth.userId',
      expressionStatement,
    );
  }

  // Convert ESTree to our domain AST
  const ast = convertNode(expressionStatement.expression);

  // Extract dependency information
  const info = extractInfo(ast);

  return {
    ast,
    ...info,
  };
}

/**
 * Convert an ESTree expression node to our domain AST.
 */
function convertNode(node: Expression): AuthorizerExpressionNode {
  switch (node.type) {
    case 'LogicalExpression': {
      return convertLogicalExpression(node);
    }

    case 'BinaryExpression': {
      return convertBinaryExpression(node);
    }

    case 'CallExpression': {
      return convertCallExpression(node);
    }

    case 'MemberExpression': {
      // A bare member expression like `model.id` without comparison
      throw new AuthorizerExpressionParseError(
        'Field reference must be part of a comparison (e.g., model.id === auth.userId)',
        node,
      );
    }

    default: {
      throw new AuthorizerExpressionParseError(
        `Unsupported expression type: ${node.type}`,
        node,
      );
    }
  }
}

/**
 * Convert a LogicalExpression (|| or &&) to BinaryLogicalNode.
 */
function convertLogicalExpression(node: LogicalExpression): BinaryLogicalNode {
  if (node.operator !== '||' && node.operator !== '&&') {
    throw new AuthorizerExpressionParseError(
      `Unsupported logical operator: ${node.operator}. Only || and && are supported.`,
      node.left.end,
      node.right.start,
    );
  }

  return {
    type: 'binaryLogical',
    operator: node.operator,
    left: convertNode(node.left),
    right: convertNode(node.right),
  };
}

/**
 * Convert a BinaryExpression (===) to FieldComparisonNode.
 */
function convertBinaryExpression(node: BinaryExpression): FieldComparisonNode {
  if (node.operator !== '===') {
    throw new AuthorizerExpressionParseError(
      `Unsupported comparison operator: ${node.operator}. Only === is supported.`,
      node.left.end,
      node.right.start,
    );
  }

  // Acorn's BinaryExpression allows PrivateIdentifier for ES2022+, but we only
  // support MemberExpression field refs. convertFieldRef will throw if given
  // anything other than MemberExpression.
  return {
    type: 'fieldComparison',
    operator: '===',
    left: convertFieldRef(node.left as Expression),
    right: convertFieldRef(node.right),
  };
}

/**
 * Convert a CallExpression to HasRoleNode.
 * Only supports auth.hasRole('roleName') pattern.
 */
function convertCallExpression(node: CallExpression): HasRoleNode {
  // Must be a member expression call: auth.hasRole(...)
  if (node.callee.type !== 'MemberExpression') {
    throw new AuthorizerExpressionParseError(
      "Function calls must be in the form auth.hasRole('roleName')",
      node,
    );
  }

  const { callee } = node;

  // Object must be 'auth'
  if (callee.object.type !== 'Identifier') {
    throw new AuthorizerExpressionParseError(
      'Function calls must be on the auth object',
      callee.object,
    );
  }

  const objectName = callee.object.name;
  if (objectName !== 'auth') {
    throw new AuthorizerExpressionParseError(
      `Function calls must be on the auth object, not '${objectName}'`,
      callee.object,
    );
  }

  // Property must be 'hasRole'
  if (callee.property.type !== 'Identifier') {
    throw new AuthorizerExpressionParseError(
      'Expected hasRole method call',
      callee.property,
    );
  }

  const methodName = callee.property.name;
  if (methodName !== 'hasRole') {
    throw new AuthorizerExpressionParseError(
      `Unsupported auth method: ${methodName}. Only hasRole is supported.`,
      callee.property,
    );
  }

  // Must have exactly one string argument
  if (node.arguments.length !== 1) {
    throw new AuthorizerExpressionParseError(
      `auth.hasRole() requires exactly one argument, got ${node.arguments.length}`,
      node,
    );
  }

  const arg = node.arguments[0];
  if (arg.type !== 'Literal' || typeof arg.value !== 'string') {
    throw new AuthorizerExpressionParseError(
      'auth.hasRole() argument must be a string literal',
      arg,
    );
  }

  const role = arg.value;

  return {
    type: 'hasRole',
    role,
    roleStart: arg.start,
    roleEnd: arg.end,
  };
}

/**
 * Convert a MemberExpression to FieldRefNode.
 * Only supports model.field or auth.field patterns.
 */
function convertFieldRef(node: Expression): FieldRefNode {
  if (node.type !== 'MemberExpression') {
    throw new AuthorizerExpressionParseError(
      'Expected field reference (model.field or auth.field)',
      node,
    );
  }

  const memberExpr = node;

  // Object must be an identifier (model or auth)
  if (memberExpr.object.type !== 'Identifier') {
    throw new AuthorizerExpressionParseError(
      'Field reference must start with model or auth',
      memberExpr.object,
    );
  }

  const source = memberExpr.object.name;
  if (source !== 'model' && source !== 'auth') {
    throw new AuthorizerExpressionParseError(
      `Field reference must start with 'model' or 'auth', not '${source}'`,
      memberExpr.object,
    );
  }

  // Property must be a simple identifier (not computed)
  if (memberExpr.computed) {
    throw new AuthorizerExpressionParseError(
      'Computed property access (e.g., model["field"]) is not supported',
      memberExpr.property,
    );
  }

  if (memberExpr.property.type !== 'Identifier') {
    throw new AuthorizerExpressionParseError(
      'Expected field name identifier',
      memberExpr.property,
    );
  }

  const field = memberExpr.property.name;

  return {
    type: 'fieldRef',
    source,
    field,
    start: node.start,
    end: node.end,
  };
}

/**
 * Extract dependency information from the parsed AST.
 */
function extractInfo(
  ast: AuthorizerExpressionNode,
): Omit<AuthorizerExpressionInfo, 'ast'> {
  const modelFieldRefs: string[] = [];
  const authFieldRefs: string[] = [];
  const roleRefs: string[] = [];
  let requiresModel = false;

  function walk(node: AuthorizerExpressionNode): void {
    switch (node.type) {
      case 'fieldComparison': {
        walkFieldRef(node.left);
        walkFieldRef(node.right);
        break;
      }

      case 'hasRole': {
        roleRefs.push(node.role);
        break;
      }

      case 'binaryLogical': {
        walk(node.left);
        walk(node.right);
        break;
      }
    }
  }

  function walkFieldRef(node: FieldRefNode): void {
    if (node.source === 'model') {
      modelFieldRefs.push(node.field);
      requiresModel = true;
    } else {
      authFieldRefs.push(node.field);
    }
  }

  walk(ast);

  return {
    modelFieldRefs: [...new Set(modelFieldRefs)],
    authFieldRefs: [...new Set(authFieldRefs)],
    roleRefs: [...new Set(roleRefs)],
    requiresModel,
  };
}
