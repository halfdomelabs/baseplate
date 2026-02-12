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

    it('should reject != operator', () => {
      expect(() => parseAuthorizerExpression('model.id !== userId')).toThrow(
        AuthorizerExpressionParseError,
      );
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

    it('should reject hasRole with multiple arguments', () => {
      expect(() =>
        parseAuthorizerExpression("hasRole('admin', 'user')"),
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
        parseAuthorizerExpression('model.id !== userId');
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
