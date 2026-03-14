import { describe, expect, it } from 'vitest';

import { parseAuthorizerExpression } from './authorizer-expression-acorn-parser.js';
import { AuthorizerExpressionParseError } from './authorizer-expression-ast.js';

describe('parseAuthorizerExpression', () => {
  describe('field comparisons', () => {
    it('should parse model.id === userId', () => {
      const result = parseAuthorizerExpression('model.id === userId');

      expect(result.ast).toEqual({
        type: 'fieldComparison',
        operator: '===',
        left: {
          type: 'fieldRef',
          source: 'model',
          field: 'id',
          start: 0,
          end: 8,
        },
        right: {
          type: 'fieldRef',
          source: 'auth',
          field: 'userId',
          start: 13,
          end: 19,
        },
      });
      expect(result.modelFieldRefs).toEqual(['id']);
      expect(result.authFieldRefs).toEqual(['userId']);
      expect(result.roleRefs).toEqual([]);
      expect(result.requiresModel).toBe(true);
    });

    it('should parse different field names', () => {
      const result = parseAuthorizerExpression('model.authorId === userId');

      expect(result.ast.type).toBe('fieldComparison');
      expect(result.modelFieldRefs).toEqual(['authorId']);
      expect(result.authFieldRefs).toEqual(['userId']);
    });

    it('should reject non-model field sources', () => {
      expect(() => parseAuthorizerExpression('foo.id === userId')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject unknown standalone identifiers', () => {
      expect(() => parseAuthorizerExpression('model.id === unknownId')).toThrow(
        AuthorizerExpressionParseError,
      );
      expect(() => parseAuthorizerExpression('model.id === foo')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should parse !== operator', () => {
      const result = parseAuthorizerExpression('model.id !== userId');

      expect(result.ast).toEqual({
        type: 'fieldComparison',
        operator: '!==',
        left: {
          type: 'fieldRef',
          source: 'model',
          field: 'id',
          start: 0,
          end: 8,
        },
        right: {
          type: 'fieldRef',
          source: 'auth',
          field: 'userId',
          start: 13,
          end: 19,
        },
      });
    });

    it('should reject == operator', () => {
      expect(() => parseAuthorizerExpression('model.id == userId')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject computed property access', () => {
      expect(() => parseAuthorizerExpression('model["id"] === userId')).toThrow(
        AuthorizerExpressionParseError,
      );
    });
  });

  describe('literal value comparisons', () => {
    it('should parse model.status === string literal', () => {
      const result = parseAuthorizerExpression("model.status === 'active'");

      expect(result.ast).toEqual({
        type: 'fieldComparison',
        operator: '===',
        left: {
          type: 'fieldRef',
          source: 'model',
          field: 'status',
          start: 0,
          end: 12,
        },
        right: {
          type: 'literalValue',
          value: 'active',
          start: 17,
          end: 25,
        },
      });
      expect(result.modelFieldRefs).toEqual(['status']);
      expect(result.authFieldRefs).toEqual([]);
      expect(result.requiresModel).toBe(true);
    });

    it('should parse model.isPublished === boolean literal', () => {
      const result = parseAuthorizerExpression('model.isPublished === true');

      expect(result.ast).toEqual({
        type: 'fieldComparison',
        operator: '===',
        left: {
          type: 'fieldRef',
          source: 'model',
          field: 'isPublished',
          start: 0,
          end: 17,
        },
        right: {
          type: 'literalValue',
          value: true,
          start: 22,
          end: 26,
        },
      });
    });

    it('should parse model.count === number literal', () => {
      const result = parseAuthorizerExpression('model.count === 42');

      expect(result.ast).toEqual({
        type: 'fieldComparison',
        operator: '===',
        left: {
          type: 'fieldRef',
          source: 'model',
          field: 'count',
          start: 0,
          end: 11,
        },
        right: {
          type: 'literalValue',
          value: 42,
          start: 16,
          end: 18,
        },
      });
    });

    it('should parse literal on left side (commutative)', () => {
      const result = parseAuthorizerExpression("'active' === model.status");

      expect(result.ast).toEqual({
        type: 'fieldComparison',
        operator: '===',
        left: {
          type: 'literalValue',
          value: 'active',
          start: 0,
          end: 8,
        },
        right: {
          type: 'fieldRef',
          source: 'model',
          field: 'status',
          start: 13,
          end: 25,
        },
      });
    });

    it('should parse model.status !== string literal', () => {
      const result = parseAuthorizerExpression("model.status !== 'draft'");

      expect(result.ast).toEqual({
        type: 'fieldComparison',
        operator: '!==',
        left: {
          type: 'fieldRef',
          source: 'model',
          field: 'status',
          start: 0,
          end: 12,
        },
        right: {
          type: 'literalValue',
          value: 'draft',
          start: 17,
          end: 24,
        },
      });
    });

    it('should reject comparing two literals', () => {
      expect(() => parseAuthorizerExpression("'active' === 'draft'")).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject null literal', () => {
      expect(() => parseAuthorizerExpression('model.status === null')).toThrow(
        AuthorizerExpressionParseError,
      );
    });
  });

  describe('hasRole expressions', () => {
    it("should parse hasRole('admin')", () => {
      const result = parseAuthorizerExpression("hasRole('admin')");

      expect(result.ast).toEqual({
        type: 'hasRole',
        role: 'admin',
        roleStart: 8,
        roleEnd: 15,
      });
      expect(result.modelFieldRefs).toEqual([]);
      expect(result.authFieldRefs).toEqual([]);
      expect(result.roleRefs).toEqual(['admin']);
      expect(result.requiresModel).toBe(false);
    });

    it('should parse hasRole with double quotes', () => {
      const result = parseAuthorizerExpression('hasRole("editor")');

      expect(result.ast).toEqual({
        type: 'hasRole',
        role: 'editor',
        roleStart: 8,
        roleEnd: 16,
      });
      expect(result.roleRefs).toEqual(['editor']);
    });

    it('should reject hasRole with no arguments', () => {
      expect(() => parseAuthorizerExpression('hasRole()')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject hasRole with two string arguments', () => {
      expect(() =>
        parseAuthorizerExpression("hasRole('admin', 'user')"),
      ).toThrow(AuthorizerExpressionParseError);
    });

    it('should reject hasRole with three arguments', () => {
      expect(() =>
        parseAuthorizerExpression("hasRole(model.todoList, 'owner', 'extra')"),
      ).toThrow(AuthorizerExpressionParseError);
    });

    it('should reject hasRole with non-string argument', () => {
      expect(() => parseAuthorizerExpression('hasRole(123)')).toThrow(
        AuthorizerExpressionParseError,
      );
    });
  });

  describe('hasSomeRole expressions', () => {
    it("should parse hasSomeRole(['admin', 'editor'])", () => {
      const result = parseAuthorizerExpression(
        "hasSomeRole(['admin', 'editor'])",
      );

      expect(result.ast).toEqual({
        type: 'hasSomeRole',
        roles: ['admin', 'editor'],
        rolesStart: [13, 22],
        rolesEnd: [20, 30],
      });
      expect(result.modelFieldRefs).toEqual([]);
      expect(result.authFieldRefs).toEqual([]);
      expect(result.roleRefs).toEqual(['admin', 'editor']);
      expect(result.requiresModel).toBe(false);
    });

    it('should parse hasSomeRole with single role', () => {
      const result = parseAuthorizerExpression("hasSomeRole(['admin'])");

      expect(result.ast).toEqual({
        type: 'hasSomeRole',
        roles: ['admin'],
        rolesStart: [13],
        rolesEnd: [20],
      });
      expect(result.roleRefs).toEqual(['admin']);
    });

    it('should reject hasSomeRole with no arguments', () => {
      expect(() => parseAuthorizerExpression('hasSomeRole()')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject hasSomeRole with non-array argument', () => {
      expect(() => parseAuthorizerExpression("hasSomeRole('admin')")).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject hasSomeRole with empty array', () => {
      expect(() => parseAuthorizerExpression('hasSomeRole([])')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject hasSomeRole with non-string array elements', () => {
      expect(() => parseAuthorizerExpression('hasSomeRole([123])')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject hasSomeRole with empty array elements', () => {
      expect(() =>
        parseAuthorizerExpression("hasSomeRole(['admin', , 'editor'])"),
      ).toThrow(AuthorizerExpressionParseError);
    });
  });

  describe('nested hasRole expressions', () => {
    it("should parse hasRole(model.todoList, 'owner')", () => {
      const result = parseAuthorizerExpression(
        "hasRole(model.todoList, 'owner')",
      );

      expect(result.ast).toEqual({
        type: 'nestedHasRole',
        relationName: 'todoList',
        relationStart: 8,
        relationEnd: 22,
        role: 'owner',
        roleStart: 24,
        roleEnd: 31,
      });
      expect(result.modelFieldRefs).toEqual([]);
      expect(result.authFieldRefs).toEqual([]);
      expect(result.roleRefs).toEqual([]);
      expect(result.nestedRoleRefs).toEqual([
        { relationName: 'todoList', roles: ['owner'] },
      ]);
      expect(result.requiresModel).toBe(true);
    });

    it('should reject hasRole with non-model relation', () => {
      expect(() =>
        parseAuthorizerExpression("hasRole(foo.todoList, 'owner')"),
      ).toThrow(AuthorizerExpressionParseError);
    });

    it('should reject hasRole with computed relation access', () => {
      expect(() =>
        parseAuthorizerExpression("hasRole(model['todoList'], 'owner')"),
      ).toThrow(AuthorizerExpressionParseError);
    });

    it('should reject hasRole with non-string role for nested form', () => {
      expect(() =>
        parseAuthorizerExpression('hasRole(model.todoList, 123)'),
      ).toThrow(AuthorizerExpressionParseError);
    });
  });

  describe('nested hasSomeRole expressions', () => {
    it("should parse hasSomeRole(model.todoList, ['owner', 'editor'])", () => {
      const result = parseAuthorizerExpression(
        "hasSomeRole(model.todoList, ['owner', 'editor'])",
      );

      expect(result.ast.type).toBe('nestedHasSomeRole');
      const ast = result.ast as Extract<
        typeof result.ast,
        { type: 'nestedHasSomeRole' }
      >;
      expect(ast.relationName).toBe('todoList');
      expect(ast.roles).toEqual(['owner', 'editor']);
      expect(result.nestedRoleRefs).toEqual([
        { relationName: 'todoList', roles: ['owner', 'editor'] },
      ]);
      expect(result.requiresModel).toBe(true);
    });

    it('should reject hasSomeRole with non-model relation', () => {
      expect(() =>
        parseAuthorizerExpression("hasSomeRole(foo.todoList, ['owner'])"),
      ).toThrow(AuthorizerExpressionParseError);
    });

    it('should reject hasSomeRole with three arguments', () => {
      expect(() =>
        parseAuthorizerExpression(
          "hasSomeRole(model.todoList, ['owner'], 'extra')",
        ),
      ).toThrow(AuthorizerExpressionParseError);
    });
  });

  describe('logical operators', () => {
    it("should parse model.id === userId || hasRole('admin')", () => {
      const result = parseAuthorizerExpression(
        "model.id === userId || hasRole('admin')",
      );

      expect(result.ast).toEqual({
        type: 'binaryLogical',
        operator: '||',
        left: {
          type: 'fieldComparison',
          operator: '===',
          left: {
            type: 'fieldRef',
            source: 'model',
            field: 'id',
            start: 0,
            end: 8,
          },
          right: {
            type: 'fieldRef',
            source: 'auth',
            field: 'userId',
            start: 13,
            end: 19,
          },
        },
        right: {
          type: 'hasRole',
          role: 'admin',
          roleStart: 31,
          roleEnd: 38,
        },
      });
      expect(result.modelFieldRefs).toEqual(['id']);
      expect(result.authFieldRefs).toEqual(['userId']);
      expect(result.roleRefs).toEqual(['admin']);
      expect(result.requiresModel).toBe(true);
    });

    it("should parse hasRole('admin') && hasRole('moderator')", () => {
      const result = parseAuthorizerExpression(
        "hasRole('admin') && hasRole('moderator')",
      );

      expect(result.ast.type).toBe('binaryLogical');
      // Type assertion - we've verified the type above
      const ast = result.ast as Extract<
        typeof result.ast,
        { type: 'binaryLogical' }
      >;
      expect(ast.operator).toBe('&&');
      expect(ast.left.type).toBe('hasRole');
      expect(ast.right.type).toBe('hasRole');
      expect(result.roleRefs).toEqual(['admin', 'moderator']);
      expect(result.requiresModel).toBe(false);
    });

    it('should parse hasSomeRole with logical operators', () => {
      const result = parseAuthorizerExpression(
        "model.id === userId && hasSomeRole(['admin', 'editor'])",
      );

      expect(result.ast.type).toBe('binaryLogical');
      expect(result.modelFieldRefs).toEqual(['id']);
      expect(result.authFieldRefs).toEqual(['userId']);
      expect(result.roleRefs).toEqual(['admin', 'editor']);
      expect(result.requiresModel).toBe(true);
    });

    it('should handle nested logical expressions', () => {
      const result = parseAuthorizerExpression(
        "hasRole('a') || hasRole('b') || hasRole('c')",
      );

      // Left-associative: ((a || b) || c)
      expect(result.ast.type).toBe('binaryLogical');
      expect(result.roleRefs).toContain('a');
      expect(result.roleRefs).toContain('b');
      expect(result.roleRefs).toContain('c');
    });

    it('should parse nested hasRole combined with field comparison', () => {
      const result = parseAuthorizerExpression(
        "model.ownerId === userId || hasRole(model.todoList, 'owner')",
      );

      expect(result.ast.type).toBe('binaryLogical');
      expect(result.modelFieldRefs).toEqual(['ownerId']);
      expect(result.authFieldRefs).toEqual(['userId']);
      expect(result.nestedRoleRefs).toEqual([
        { relationName: 'todoList', roles: ['owner'] },
      ]);
      expect(result.requiresModel).toBe(true);
    });

    it('should reject nullish coalescing operator', () => {
      expect(() =>
        parseAuthorizerExpression("hasRole('a') ?? hasRole('b')"),
      ).toThrow(AuthorizerExpressionParseError);
    });
  });

  describe('dependency extraction', () => {
    it('should deduplicate model field refs', () => {
      const result = parseAuthorizerExpression(
        'model.id === userId || model.id === userId',
      );

      expect(result.modelFieldRefs).toEqual(['id']);
    });

    it('should deduplicate role refs', () => {
      const result = parseAuthorizerExpression(
        "hasRole('admin') || hasRole('admin')",
      );

      expect(result.roleRefs).toEqual(['admin']);
    });

    it('should collect multiple different refs', () => {
      const result = parseAuthorizerExpression(
        "model.authorId === userId || model.editorId === userId || hasRole('admin')",
      );

      expect(result.modelFieldRefs).toEqual(['authorId', 'editorId']);
      expect(result.authFieldRefs).toEqual(['userId']);
      expect(result.roleRefs).toEqual(['admin']);
    });
  });

  describe('isAuthenticated expressions', () => {
    it('should parse standalone isAuthenticated', () => {
      const result = parseAuthorizerExpression('isAuthenticated');

      expect(result.ast).toEqual({
        type: 'isAuthenticated',
      });
      expect(result.modelFieldRefs).toEqual([]);
      expect(result.authFieldRefs).toEqual([]);
      expect(result.roleRefs).toEqual([]);
      expect(result.requiresModel).toBe(false);
    });

    it('should parse isAuthenticated && model.isPublished', () => {
      const result = parseAuthorizerExpression(
        'isAuthenticated && model.isPublished === userId',
      );

      expect(result.ast.type).toBe('binaryLogical');
      const ast = result.ast as Extract<
        typeof result.ast,
        { type: 'binaryLogical' }
      >;
      expect(ast.operator).toBe('&&');
      expect(ast.left).toEqual({ type: 'isAuthenticated' });
      expect(result.requiresModel).toBe(true);
    });

    it('should parse model.ownerId === userId || isAuthenticated', () => {
      const result = parseAuthorizerExpression(
        'model.ownerId === userId || isAuthenticated',
      );

      expect(result.ast.type).toBe('binaryLogical');
      const ast = result.ast as Extract<
        typeof result.ast,
        { type: 'binaryLogical' }
      >;
      expect(ast.operator).toBe('||');
      expect(ast.right).toEqual({ type: 'isAuthenticated' });
      expect(result.modelFieldRefs).toEqual(['ownerId']);
      expect(result.authFieldRefs).toEqual(['userId']);
      expect(result.requiresModel).toBe(true);
    });

    it('should reject unknown standalone identifiers at top level', () => {
      expect(() => parseAuthorizerExpression('unknownVar')).toThrow(
        AuthorizerExpressionParseError,
      );
    });
  });

  describe('exists() expressions', () => {
    it('should parse exists(model.members, { userId: userId })', () => {
      const result = parseAuthorizerExpression(
        'exists(model.members, { userId: userId })',
      );

      expect(result.ast).toEqual({
        type: 'relationFilter',
        relationName: 'members',
        relationStart: 7,
        relationEnd: 20,
        operator: 'some',
        conditions: [
          {
            field: 'userId',
            value: {
              type: 'fieldRef',
              source: 'auth',
              field: 'userId',
              start: 32,
              end: 38,
            },
          },
        ],
      });
      expect(result.modelFieldRefs).toEqual([]);
      expect(result.authFieldRefs).toEqual(['userId']);
      expect(result.relationFilterRefs).toEqual([{ relationName: 'members' }]);
      expect(result.requiresModel).toBe(true);
    });

    it('should parse exists with literal condition', () => {
      const result = parseAuthorizerExpression(
        "exists(model.members, { type: 'admin' })",
      );

      expect(result.ast.type).toBe('relationFilter');
      const ast = result.ast as Extract<
        typeof result.ast,
        { type: 'relationFilter' }
      >;
      expect(ast.operator).toBe('some');
      expect(ast.conditions).toEqual([
        {
          field: 'type',
          value: {
            type: 'literalValue',
            value: 'admin',
            start: 30,
            end: 37,
          },
        },
      ]);
      expect(result.authFieldRefs).toEqual([]);
    });

    it('should parse exists with multiple conditions', () => {
      const result = parseAuthorizerExpression(
        "exists(model.members, { userId: userId, type: 'admin' })",
      );

      expect(result.ast.type).toBe('relationFilter');
      const ast = result.ast as Extract<
        typeof result.ast,
        { type: 'relationFilter' }
      >;
      expect(ast.conditions).toHaveLength(2);
      expect(ast.conditions[0].field).toBe('userId');
      expect(ast.conditions[0].value.type).toBe('fieldRef');
      expect(ast.conditions[1].field).toBe('type');
      expect(ast.conditions[1].value.type).toBe('literalValue');
      expect(result.authFieldRefs).toEqual(['userId']);
    });

    it('should parse exists with boolean literal condition', () => {
      const result = parseAuthorizerExpression(
        'exists(model.tasks, { isCompleted: true })',
      );

      expect(result.ast.type).toBe('relationFilter');
      const ast = result.ast as Extract<
        typeof result.ast,
        { type: 'relationFilter' }
      >;
      expect(ast.conditions[0]).toEqual({
        field: 'isCompleted',
        value: {
          type: 'literalValue',
          value: true,
          start: 35,
          end: 39,
        },
      });
    });

    it('should reject exists with no arguments', () => {
      expect(() => parseAuthorizerExpression('exists()')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject exists with one argument', () => {
      expect(() => parseAuthorizerExpression('exists(model.members)')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject exists with non-model relation', () => {
      expect(() =>
        parseAuthorizerExpression('exists(foo.members, { userId: userId })'),
      ).toThrow(AuthorizerExpressionParseError);
    });

    it('should reject exists with non-object second argument', () => {
      expect(() =>
        parseAuthorizerExpression("exists(model.members, 'invalid')"),
      ).toThrow(AuthorizerExpressionParseError);
    });

    it('should reject exists with empty conditions object', () => {
      expect(() =>
        parseAuthorizerExpression('exists(model.members, {})'),
      ).toThrow(AuthorizerExpressionParseError);
    });

    it('should reject exists with computed property key', () => {
      expect(() =>
        parseAuthorizerExpression(
          'exists(model.members, { ["userId"]: userId })',
        ),
      ).toThrow(AuthorizerExpressionParseError);
    });
  });

  describe('all() expressions', () => {
    it('should parse all(model.tasks, { isCompleted: true })', () => {
      const result = parseAuthorizerExpression(
        'all(model.tasks, { isCompleted: true })',
      );

      expect(result.ast).toEqual({
        type: 'relationFilter',
        relationName: 'tasks',
        relationStart: 4,
        relationEnd: 15,
        operator: 'every',
        conditions: [
          {
            field: 'isCompleted',
            value: {
              type: 'literalValue',
              value: true,
              start: 32,
              end: 36,
            },
          },
        ],
      });
      expect(result.relationFilterRefs).toEqual([{ relationName: 'tasks' }]);
      expect(result.requiresModel).toBe(true);
    });

    it('should parse all with auth field condition', () => {
      const result = parseAuthorizerExpression(
        'all(model.items, { ownerId: userId })',
      );

      expect(result.ast.type).toBe('relationFilter');
      const ast = result.ast as Extract<
        typeof result.ast,
        { type: 'relationFilter' }
      >;
      expect(ast.operator).toBe('every');
      expect(ast.conditions[0].field).toBe('ownerId');
      expect(result.authFieldRefs).toEqual(['userId']);
    });
  });

  describe('exists/all combined with logical operators', () => {
    it('should parse exists combined with ||', () => {
      const result = parseAuthorizerExpression(
        'model.id === userId || exists(model.members, { userId: userId })',
      );

      expect(result.ast.type).toBe('binaryLogical');
      expect(result.modelFieldRefs).toEqual(['id']);
      expect(result.authFieldRefs).toEqual(['userId']);
      expect(result.relationFilterRefs).toEqual([{ relationName: 'members' }]);
      expect(result.requiresModel).toBe(true);
    });

    it('should parse exists combined with hasRole', () => {
      const result = parseAuthorizerExpression(
        "exists(model.members, { userId: userId }) || hasRole('admin')",
      );

      expect(result.ast.type).toBe('binaryLogical');
      expect(result.authFieldRefs).toEqual(['userId']);
      expect(result.roleRefs).toEqual(['admin']);
      expect(result.relationFilterRefs).toEqual([{ relationName: 'members' }]);
    });
  });

  describe('syntax errors', () => {
    it('should reject invalid JavaScript syntax', () => {
      expect(() => parseAuthorizerExpression('model.id ===')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject trailing content', () => {
      expect(() =>
        parseAuthorizerExpression('model.id === userId extra'),
      ).toThrow(AuthorizerExpressionParseError);
    });

    it('should reject bare field references', () => {
      expect(() => parseAuthorizerExpression('model.id')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject literals', () => {
      expect(() => parseAuthorizerExpression('"admin"')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject unknown standalone function calls', () => {
      expect(() => parseAuthorizerExpression('unknownFunc()')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject standalone userId without comparison', () => {
      expect(() => parseAuthorizerExpression('userId')).toThrow(
        AuthorizerExpressionParseError,
      );
    });
  });

  describe('error positions', () => {
    it('should include position in error for invalid operator', () => {
      let caughtError: unknown;
      try {
        parseAuthorizerExpression('model.id == userId');
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(AuthorizerExpressionParseError);
      expect(
        (caughtError as AuthorizerExpressionParseError).startPosition,
      ).toBeDefined();
    });
  });
});
