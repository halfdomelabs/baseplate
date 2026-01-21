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
