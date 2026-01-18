import { describe, expect, it } from 'vitest';

import { parseAuthorizerExpression } from './authorizer-expression-acorn-parser.js';
import { AuthorizerExpressionParseError } from './authorizer-expression-ast.js';

describe('parseAuthorizerExpression', () => {
  describe('field comparisons', () => {
    it('should parse model.id === auth.userId', () => {
      const result = parseAuthorizerExpression('model.id === auth.userId');

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
          end: 24,
        },
      });
      expect(result.modelFieldRefs).toEqual(['id']);
      expect(result.authFieldRefs).toEqual(['userId']);
      expect(result.roleRefs).toEqual([]);
      expect(result.requiresModel).toBe(true);
    });

    it('should parse different field names', () => {
      const result = parseAuthorizerExpression(
        'model.authorId === auth.userId',
      );

      expect(result.ast.type).toBe('fieldComparison');
      expect(result.modelFieldRefs).toEqual(['authorId']);
      expect(result.authFieldRefs).toEqual(['userId']);
    });

    it('should reject non-model/auth field sources', () => {
      expect(() => parseAuthorizerExpression('foo.id === auth.userId')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject != operator', () => {
      expect(() =>
        parseAuthorizerExpression('model.id !== auth.userId'),
      ).toThrow(AuthorizerExpressionParseError);
    });

    it('should reject == operator', () => {
      expect(() =>
        parseAuthorizerExpression('model.id == auth.userId'),
      ).toThrow(AuthorizerExpressionParseError);
    });

    it('should reject computed property access', () => {
      expect(() =>
        parseAuthorizerExpression('model["id"] === auth.userId'),
      ).toThrow(AuthorizerExpressionParseError);
    });
  });

  describe('hasRole expressions', () => {
    it("should parse auth.hasRole('admin')", () => {
      const result = parseAuthorizerExpression("auth.hasRole('admin')");

      expect(result.ast).toEqual({
        type: 'hasRole',
        role: 'admin',
        roleStart: 13,
        roleEnd: 20,
      });
      expect(result.modelFieldRefs).toEqual([]);
      expect(result.authFieldRefs).toEqual([]);
      expect(result.roleRefs).toEqual(['admin']);
      expect(result.requiresModel).toBe(false);
    });

    it('should parse hasRole with double quotes', () => {
      const result = parseAuthorizerExpression('auth.hasRole("editor")');

      expect(result.ast).toEqual({
        type: 'hasRole',
        role: 'editor',
        roleStart: 13,
        roleEnd: 21,
      });
      expect(result.roleRefs).toEqual(['editor']);
    });

    it('should reject hasRole on non-auth object', () => {
      expect(() => parseAuthorizerExpression("model.hasRole('admin')")).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject hasRole with no arguments', () => {
      expect(() => parseAuthorizerExpression('auth.hasRole()')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject hasRole with multiple arguments', () => {
      expect(() =>
        parseAuthorizerExpression("auth.hasRole('admin', 'user')"),
      ).toThrow(AuthorizerExpressionParseError);
    });

    it('should reject hasRole with non-string argument', () => {
      expect(() => parseAuthorizerExpression('auth.hasRole(123)')).toThrow(
        AuthorizerExpressionParseError,
      );
    });

    it('should reject other auth methods', () => {
      expect(() =>
        parseAuthorizerExpression("auth.hasSomeRole(['admin'])"),
      ).toThrow(AuthorizerExpressionParseError);
    });
  });

  describe('logical operators', () => {
    it("should parse model.id === auth.userId || auth.hasRole('admin')", () => {
      const result = parseAuthorizerExpression(
        "model.id === auth.userId || auth.hasRole('admin')",
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
            end: 24,
          },
        },
        right: {
          type: 'hasRole',
          role: 'admin',
          roleStart: 41,
          roleEnd: 48,
        },
      });
      expect(result.modelFieldRefs).toEqual(['id']);
      expect(result.authFieldRefs).toEqual(['userId']);
      expect(result.roleRefs).toEqual(['admin']);
      expect(result.requiresModel).toBe(true);
    });

    it("should parse auth.hasRole('admin') && auth.hasRole('moderator')", () => {
      const result = parseAuthorizerExpression(
        "auth.hasRole('admin') && auth.hasRole('moderator')",
      );

      expect(result.ast.type).toBe('binaryLogical');
      if (result.ast.type === 'binaryLogical') {
        expect(result.ast.operator).toBe('&&');
        expect(result.ast.left.type).toBe('hasRole');
        expect(result.ast.right.type).toBe('hasRole');
      }
      expect(result.roleRefs).toEqual(['admin', 'moderator']);
      expect(result.requiresModel).toBe(false);
    });

    it('should handle nested logical expressions', () => {
      const result = parseAuthorizerExpression(
        "auth.hasRole('a') || auth.hasRole('b') || auth.hasRole('c')",
      );

      // Left-associative: ((a || b) || c)
      expect(result.ast.type).toBe('binaryLogical');
      expect(result.roleRefs).toContain('a');
      expect(result.roleRefs).toContain('b');
      expect(result.roleRefs).toContain('c');
    });

    it('should reject nullish coalescing operator', () => {
      expect(() =>
        parseAuthorizerExpression("auth.hasRole('a') ?? auth.hasRole('b')"),
      ).toThrow(AuthorizerExpressionParseError);
    });
  });

  describe('dependency extraction', () => {
    it('should deduplicate model field refs', () => {
      const result = parseAuthorizerExpression(
        'model.id === auth.userId || model.id === auth.userId',
      );

      expect(result.modelFieldRefs).toEqual(['id']);
    });

    it('should deduplicate role refs', () => {
      const result = parseAuthorizerExpression(
        "auth.hasRole('admin') || auth.hasRole('admin')",
      );

      expect(result.roleRefs).toEqual(['admin']);
    });

    it('should collect multiple different refs', () => {
      const result = parseAuthorizerExpression(
        "model.authorId === auth.userId || model.editorId === auth.userId || auth.hasRole('admin')",
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
        parseAuthorizerExpression('model.id === auth.userId extra'),
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

    it('should reject standalone function calls', () => {
      expect(() => parseAuthorizerExpression('hasRole("admin")')).toThrow(
        AuthorizerExpressionParseError,
      );
    });
  });

  describe('error positions', () => {
    it('should include position in error for invalid operator', () => {
      try {
        parseAuthorizerExpression('model.id !== auth.userId');
        expect.fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizerExpressionParseError);
        expect(
          (error as AuthorizerExpressionParseError).startPosition,
        ).toBeDefined();
      }
    });
  });
});
