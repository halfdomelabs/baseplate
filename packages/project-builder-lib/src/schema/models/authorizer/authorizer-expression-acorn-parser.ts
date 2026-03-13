/**
 * Parser for authorizer expressions using Acorn.
 *
 * Parses expressions with implicit auth context:
 * - `model.id === userId`
 * - `hasRole('admin')`
 * - `hasSomeRole(['admin', 'moderator'])`
 * - `model.id === userId || hasRole('admin')`
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
  HasSomeRoleNode,
  IsAuthenticatedNode,
  LiteralValueNode,
  NestedHasRoleNode,
  NestedHasSomeRoleNode,
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

    case 'Identifier': {
      if (node.name === 'isAuthenticated') {
        return { type: 'isAuthenticated' } satisfies IsAuthenticatedNode;
      }
      throw new AuthorizerExpressionParseError(
        `Unknown identifier '${node.name}'. Use hasRole(), hasSomeRole(), isAuthenticated, or a comparison like model.id === userId.`,
        node,
      );
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
 * Convert a BinaryExpression (=== or !==) to FieldComparisonNode.
 */
function convertBinaryExpression(node: BinaryExpression): FieldComparisonNode {
  if (node.operator !== '===' && node.operator !== '!==') {
    throw new AuthorizerExpressionParseError(
      `Unsupported comparison operator: ${node.operator}. Only === and !== are supported.`,
      node.left.end,
      node.right.start,
    );
  }

  const left = convertFieldRefOrLiteral(node.left as Expression);
  const right = convertFieldRefOrLiteral(node.right);

  // At least one side must be a field reference — comparing two literals is not allowed.
  if (left.type === 'literalValue' && right.type === 'literalValue') {
    throw new AuthorizerExpressionParseError(
      'At least one side of a comparison must be a field reference (e.g., model.field or userId).',
      node,
    );
  }

  return {
    type: 'fieldComparison',
    operator: node.operator,
    left,
    right,
  };
}

/**
 * Convert an expression node to either a FieldRefNode or a LiteralValueNode.
 * Supports string, number, and boolean literals.
 */
function convertFieldRefOrLiteral(
  node: Expression,
): FieldRefNode | LiteralValueNode {
  if (node.type === 'Literal') {
    const { value } = node;
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return {
        type: 'literalValue',
        value,
        start: node.start,
        end: node.end,
      } satisfies LiteralValueNode;
    }
    throw new AuthorizerExpressionParseError(
      'Unsupported literal type. Only string, number, and boolean literals are supported.',
      node,
    );
  }
  return convertFieldRef(node);
}

/**
 * Convert a CallExpression to HasRoleNode or HasSomeRoleNode.
 * Supports:
 * - `hasRole('admin')`
 * - `hasSomeRole(['admin', 'moderator'])`
 */
function convertCallExpression(
  node: CallExpression,
): HasRoleNode | HasSomeRoleNode | NestedHasRoleNode | NestedHasSomeRoleNode {
  // Only support direct calls (e.g., hasRole(...))
  if (node.callee.type !== 'Identifier') {
    throw new AuthorizerExpressionParseError(
      'Function calls must be standalone (hasRole, hasSomeRole)',
      node.callee,
    );
  }

  const funcName = node.callee.name;

  if (funcName === 'hasRole') {
    return parseHasRoleArgs(node, 'hasRole()');
  }

  if (funcName === 'hasSomeRole') {
    return parseHasSomeRoleArgs(node, 'hasSomeRole()');
  }

  throw new AuthorizerExpressionParseError(
    `Unknown function '${funcName}'. Use hasRole() or hasSomeRole().`,
    node.callee,
  );
}

/**
 * Parse a `model.X` MemberExpression argument for nested role checks.
 * Returns the relation name and position info.
 */
function parseModelRelationArg(
  arg: Expression,
  funcName: string,
): { relationName: string; relationStart: number; relationEnd: number } {
  if (arg.type !== 'MemberExpression') {
    throw new AuthorizerExpressionParseError(
      `${funcName} first argument must be a model relation (e.g., model.todoList)`,
      arg,
    );
  }

  if (arg.object.type !== 'Identifier' || arg.object.name !== 'model') {
    throw new AuthorizerExpressionParseError(
      `${funcName} first argument must start with 'model' (e.g., model.todoList)`,
      arg.object,
    );
  }

  if (arg.computed) {
    throw new AuthorizerExpressionParseError(
      `${funcName} computed property access (e.g., model["relation"]) is not supported`,
      arg.property,
    );
  }

  if (arg.property.type !== 'Identifier') {
    throw new AuthorizerExpressionParseError(
      `${funcName} expected relation name identifier`,
      arg.property,
    );
  }

  return {
    relationName: arg.property.name,
    relationStart: arg.start,
    relationEnd: arg.end,
  };
}

/**
 * Parse hasRole('role') or hasRole(model.relation, 'role') arguments.
 */
function parseHasRoleArgs(
  node: CallExpression,
  funcName: string,
): HasRoleNode | NestedHasRoleNode {
  if (node.arguments.length === 1) {
    // Global role check: hasRole('admin')
    const arg = node.arguments[0];
    if (arg.type !== 'Literal' || typeof arg.value !== 'string') {
      throw new AuthorizerExpressionParseError(
        `${funcName} argument must be a string literal`,
        arg,
      );
    }

    return {
      type: 'hasRole',
      role: arg.value,
      roleStart: arg.start,
      roleEnd: arg.end,
    };
  }

  if (node.arguments.length === 2) {
    // Nested role check: hasRole(model.relation, 'role')
    const relationArg = node.arguments[0];
    const roleArg = node.arguments[1];

    const relation = parseModelRelationArg(relationArg as Expression, funcName);

    if (roleArg.type !== 'Literal' || typeof roleArg.value !== 'string') {
      throw new AuthorizerExpressionParseError(
        `${funcName} second argument must be a string literal (role name)`,
        roleArg,
      );
    }

    return {
      type: 'nestedHasRole',
      relationName: relation.relationName,
      relationStart: relation.relationStart,
      relationEnd: relation.relationEnd,
      role: roleArg.value,
      roleStart: roleArg.start,
      roleEnd: roleArg.end,
    };
  }

  throw new AuthorizerExpressionParseError(
    `${funcName} requires 1 argument (hasRole('role')) or 2 arguments (hasRole(model.relation, 'role')), got ${node.arguments.length}`,
    node,
  );
}

/**
 * Parse a roles array argument from an ArrayExpression.
 * Returns the extracted role names and their positions.
 */
function parseRolesArrayArg(
  arg: Expression,
  funcName: string,
): { roles: string[]; rolesStart: number[]; rolesEnd: number[] } {
  if (arg.type !== 'ArrayExpression') {
    throw new AuthorizerExpressionParseError(
      `${funcName} argument must be an array literal (e.g., ['admin', 'moderator'])`,
      arg,
    );
  }

  const roles: string[] = [];
  const rolesStart: number[] = [];
  const rolesEnd: number[] = [];

  for (const element of arg.elements) {
    if (!element) {
      throw new AuthorizerExpressionParseError(
        `${funcName} array cannot have empty elements`,
        arg,
      );
    }

    if (element.type !== 'Literal' || typeof element.value !== 'string') {
      throw new AuthorizerExpressionParseError(
        `${funcName} array elements must be string literals`,
        element,
      );
    }

    roles.push(element.value);
    rolesStart.push(element.start);
    rolesEnd.push(element.end);
  }

  if (roles.length === 0) {
    throw new AuthorizerExpressionParseError(
      `${funcName} requires at least one role`,
      arg,
    );
  }

  return { roles, rolesStart, rolesEnd };
}

/**
 * Parse hasSomeRole(['role1', 'role2']) or hasSomeRole(model.relation, ['role1', 'role2']) arguments.
 */
function parseHasSomeRoleArgs(
  node: CallExpression,
  funcName: string,
): HasSomeRoleNode | NestedHasSomeRoleNode {
  if (node.arguments.length === 1) {
    // Global role check: hasSomeRole(['admin', 'moderator'])
    const { roles, rolesStart, rolesEnd } = parseRolesArrayArg(
      node.arguments[0] as Expression,
      funcName,
    );

    return {
      type: 'hasSomeRole',
      roles,
      rolesStart,
      rolesEnd,
    };
  }

  if (node.arguments.length === 2) {
    // Nested role check: hasSomeRole(model.relation, ['role1', 'role2'])
    const relationArg = node.arguments[0];
    const rolesArg = node.arguments[1];

    const relation = parseModelRelationArg(relationArg as Expression, funcName);
    const { roles, rolesStart, rolesEnd } = parseRolesArrayArg(
      rolesArg as Expression,
      funcName,
    );

    return {
      type: 'nestedHasSomeRole',
      relationName: relation.relationName,
      relationStart: relation.relationStart,
      relationEnd: relation.relationEnd,
      roles,
      rolesStart,
      rolesEnd,
    };
  }

  throw new AuthorizerExpressionParseError(
    `${funcName} requires 1 argument (hasSomeRole(['role1'])) or 2 arguments (hasSomeRole(model.relation, ['role1'])), got ${node.arguments.length}`,
    node,
  );
}

/**
 * Convert to FieldRefNode.
 * Supports:
 * - Standalone identifier for implicit auth context: `userId`
 * - Member expressions: `model.field`
 */
function convertFieldRef(node: Expression): FieldRefNode {
  // Handle standalone identifier (implicit auth context)
  if (node.type === 'Identifier') {
    const identifier = node;
    const { name } = identifier;

    // Only userId is valid as a standalone identifier (implicit auth context)
    if (name === 'userId') {
      return {
        type: 'fieldRef',
        source: 'auth',
        field: 'userId',
        start: node.start,
        end: node.end,
      };
    }

    throw new AuthorizerExpressionParseError(
      `Unknown identifier '${name}'. Did you mean 'model.${name}' or use 'userId' for auth context?`,
      node,
    );
  }

  if (node.type !== 'MemberExpression') {
    throw new AuthorizerExpressionParseError(
      'Expected field reference (model.field or userId)',
      node,
    );
  }

  const memberExpr = node;

  // Object must be an identifier
  if (memberExpr.object.type !== 'Identifier') {
    throw new AuthorizerExpressionParseError(
      'Field reference must start with model',
      memberExpr.object,
    );
  }

  const source = memberExpr.object.name;
  if (source !== 'model') {
    throw new AuthorizerExpressionParseError(
      `Field reference must start with 'model', not '${source}'`,
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
    source: 'model',
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
  const nestedRoleRefs: { relationName: string; roles: string[] }[] = [];
  let requiresModel = false;

  function walk(node: AuthorizerExpressionNode): void {
    switch (node.type) {
      case 'fieldComparison': {
        if (node.left.type === 'fieldRef') {
          walkFieldRef(node.left);
        }
        if (node.right.type === 'fieldRef') {
          walkFieldRef(node.right);
        }
        break;
      }

      case 'hasRole': {
        roleRefs.push(node.role);
        break;
      }

      case 'hasSomeRole': {
        roleRefs.push(...node.roles);
        break;
      }

      case 'nestedHasRole': {
        nestedRoleRefs.push({
          relationName: node.relationName,
          roles: [node.role],
        });
        requiresModel = true;
        break;
      }

      case 'nestedHasSomeRole': {
        nestedRoleRefs.push({
          relationName: node.relationName,
          roles: node.roles,
        });
        requiresModel = true;
        break;
      }

      case 'isAuthenticated': {
        // No dependencies to track
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
    nestedRoleRefs,
    requiresModel,
  };
}
