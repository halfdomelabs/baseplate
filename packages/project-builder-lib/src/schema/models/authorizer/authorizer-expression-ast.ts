/**
 * AST node types for authorizer expressions.
 *
 * These represent the semantic structure of expressions like:
 * - `model.id === userId`
 * - `hasRole('admin')`
 * - `hasSomeRole(['admin', 'moderator'])`
 * - `model.id === userId || hasRole('admin')`
 *
 * The AST is produced by parsing with Acorn and converting from ESTree.
 */

/**
 * Root expression node - the result of parsing an authorizer expression.
 */
export type AuthorizerExpressionNode =
  | FieldComparisonNode
  | HasRoleNode
  | HasSomeRoleNode
  | NestedHasRoleNode
  | NestedHasSomeRoleNode
  | IsAuthenticatedNode
  | BinaryLogicalNode;

/**
 * A field comparison expression: `left === right`
 *
 * Currently only supports strict equality (`===`).
 *
 * @example
 * ```typescript
 * // model.id === auth.userId
 * {
 *   type: 'fieldComparison',
 *   operator: '===',
 *   left: { type: 'fieldRef', source: 'model', field: 'id', ... },
 *   right: { type: 'fieldRef', source: 'auth', field: 'userId', ... },
 * }
 * ```
 */
export interface FieldComparisonNode {
  type: 'fieldComparison';
  operator: '===';
  left: FieldRefNode;
  right: FieldRefNode;
}

/**
 * A role check expression: `hasRole('roleName')`
 *
 * @example
 * ```typescript
 * // hasRole('admin')
 * {
 *   type: 'hasRole',
 *   role: 'admin',
 *   roleStart: 8,
 *   roleEnd: 15,
 * }
 * ```
 */
export interface HasRoleNode {
  type: 'hasRole';
  /** The role name being checked */
  role: string;
  /** Start position of the role string in the source (for rename tracking) */
  roleStart: number;
  /** End position of the role string in the source (for rename tracking) */
  roleEnd: number;
}

/**
 * A role check expression for multiple roles: `hasSomeRole(['role1', 'role2'])`
 *
 * @example
 * ```typescript
 * // hasSomeRole(['admin', 'moderator'])
 * {
 *   type: 'hasSomeRole',
 *   roles: ['admin', 'moderator'],
 *   rolesStart: [13, 22],
 *   rolesEnd: [20, 33],
 * }
 * ```
 */
export interface HasSomeRoleNode {
  type: 'hasSomeRole';
  /** The role names being checked */
  roles: string[];
  /** Start positions of each role string in the source (for rename tracking) */
  rolesStart: number[];
  /** End positions of each role string in the source (for rename tracking) */
  rolesEnd: number[];
}

/**
 * A nested role check expression: `hasRole(model.relation, 'roleName')`
 *
 * Checks if the current user has the specified role on a related model's authorizer.
 *
 * @example
 * ```typescript
 * // hasRole(model.todoList, 'owner')
 * {
 *   type: 'nestedHasRole',
 *   relationName: 'todoList',
 *   role: 'owner',
 * }
 * ```
 */
export interface NestedHasRoleNode {
  type: 'nestedHasRole';
  /** The relation name on the current model (e.g., 'todoList') */
  relationName: string;
  /** Start position of model.relation in the source */
  relationStart: number;
  /** End position of model.relation in the source */
  relationEnd: number;
  /** The role name on the foreign model's authorizer */
  role: string;
  /** Start position of the role string literal in the source (for rename tracking) */
  roleStart: number;
  /** End position of the role string literal in the source (for rename tracking) */
  roleEnd: number;
}

/**
 * A nested role check expression for multiple roles: `hasSomeRole(model.relation, ['role1', 'role2'])`
 *
 * Checks if the current user has any of the specified roles on a related model's authorizer.
 *
 * @example
 * ```typescript
 * // hasSomeRole(model.todoList, ['owner', 'editor'])
 * {
 *   type: 'nestedHasSomeRole',
 *   relationName: 'todoList',
 *   roles: ['owner', 'editor'],
 * }
 * ```
 */
export interface NestedHasSomeRoleNode {
  type: 'nestedHasSomeRole';
  /** The relation name on the current model (e.g., 'todoList') */
  relationName: string;
  /** Start position of model.relation in the source */
  relationStart: number;
  /** End position of model.relation in the source */
  relationEnd: number;
  /** The role names on the foreign model's authorizer */
  roles: string[];
  /** Start positions of each role string literal in the source (for rename tracking) */
  rolesStart: number[];
  /** End positions of each role string literal in the source (for rename tracking) */
  rolesEnd: number[];
}

/**
 * A boolean indicating whether the user is authenticated.
 *
 * Can be used standalone or in logical expressions:
 * - `isAuthenticated`
 * - `isAuthenticated && model.isPublished`
 *
 * @example
 * ```typescript
 * // isAuthenticated
 * { type: 'isAuthenticated' }
 * ```
 */
export interface IsAuthenticatedNode {
  type: 'isAuthenticated';
}

/**
 * A binary logical expression: `left || right` or `left && right`
 *
 * @example
 * ```typescript
 * // model.id === auth.userId || auth.hasRole('admin')
 * {
 *   type: 'binaryLogical',
 *   operator: '||',
 *   left: { type: 'fieldComparison', ... },
 *   right: { type: 'hasRole', ... },
 * }
 * ```
 */
export interface BinaryLogicalNode {
  type: 'binaryLogical';
  operator: '||' | '&&';
  left: AuthorizerExpressionNode;
  right: AuthorizerExpressionNode;
}

/**
 * A reference to a field on either `model` or `auth`.
 *
 * @example
 * ```typescript
 * // model.id
 * { type: 'fieldRef', source: 'model', field: 'id', start: 0, end: 8 }
 *
 * // userId - implicit auth context
 * { type: 'fieldRef', source: 'auth', field: 'userId', start: 13, end: 19 }
 * ```
 */
export interface FieldRefNode {
  type: 'fieldRef';
  /** The source object - either 'model' or 'auth' */
  source: 'model' | 'auth';
  /** The field name being accessed */
  field: string;
  /** Start position in the source (for rename tracking) */
  start: number;
  /** End position in the source (for rename tracking) */
  end: number;
}

/**
 * Information extracted from a parsed expression for dependency tracking.
 */
export interface AuthorizerExpressionInfo {
  /** The parsed AST */
  ast: AuthorizerExpressionNode;
  /** Model field names referenced (e.g., ['id', 'authorId']) */
  modelFieldRefs: string[];
  /** Auth field names referenced (e.g., ['userId']) */
  authFieldRefs: string[];
  /** Role names referenced (e.g., ['admin', 'user']) */
  roleRefs: string[];
  /** Nested role references via model relations (e.g., hasRole(model.todoList, 'owner')) */
  nestedRoleRefs: { relationName: string; roles: string[] }[];
  /** Whether the expression requires the model instance */
  requiresModel: boolean;
}

/**
 * Position information for error reporting.
 * Compatible with Acorn AST nodes which have start/end properties.
 */
export interface NodePosition {
  start: number;
  end: number;
}

/**
 * Error thrown when parsing an authorizer expression fails.
 */
export class AuthorizerExpressionParseError extends Error {
  readonly startPosition?: number;
  readonly endPosition?: number;

  constructor(message: string, position?: NodePosition);
  constructor(message: string, startPosition?: number, endPosition?: number);
  constructor(
    message: string,
    positionOrStart?: NodePosition | number,
    endPosition?: number,
  ) {
    super(message);
    this.name = 'AuthorizerExpressionParseError';

    if (typeof positionOrStart === 'object') {
      this.startPosition = positionOrStart.start;
      this.endPosition = positionOrStart.end;
    } else {
      this.startPosition = positionOrStart;
      this.endPosition = endPosition;
    }
  }
}
