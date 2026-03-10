import { parseAuthorizerExpression } from '@baseplate-dev/project-builder-lib';
import { describe, expect, it } from 'vitest';

import {
  generateAuthorizerExpressionCode,
  generateQueryFilterExpressionCode,
} from './authorizers.js';

function generate(expression: string): string {
  const parsed = parseAuthorizerExpression(expression);
  return generateAuthorizerExpressionCode(parsed.ast);
}

function generateQF(
  expression: string,
  codeContext?: Parameters<typeof generateQueryFilterExpressionCode>[1],
): string {
  const parsed = parseAuthorizerExpression(expression);
  return generateQueryFilterExpressionCode(parsed.ast, codeContext);
}

describe('generateAuthorizerExpressionCode', () => {
  describe('field comparisons', () => {
    it('should transform model field === userId', () => {
      expect(generate('model.id === userId')).toBe(
        'model.id === ctx.auth.userId',
      );
    });

    it('should transform different field names', () => {
      expect(generate('model.authorId === userId')).toBe(
        'model.authorId === ctx.auth.userId',
      );
    });
  });

  describe('hasRole', () => {
    it('should transform hasRole to ctx.auth.hasRole', () => {
      expect(generate("hasRole('admin')")).toBe("ctx.auth.hasRole('admin')");
    });

    it('should handle different role names', () => {
      expect(generate("hasRole('moderator')")).toBe(
        "ctx.auth.hasRole('moderator')",
      );
    });
  });

  describe('hasSomeRole', () => {
    it('should transform hasSomeRole to ctx.auth.hasSomeRole', () => {
      expect(generate("hasSomeRole(['admin', 'moderator'])")).toBe(
        "ctx.auth.hasSomeRole(['admin', 'moderator'])",
      );
    });

    it('should handle single role array', () => {
      expect(generate("hasSomeRole(['user'])")).toBe(
        "ctx.auth.hasSomeRole(['user'])",
      );
    });
  });

  describe('logical operators', () => {
    it('should parenthesize OR expressions', () => {
      expect(generate("model.id === userId || hasRole('admin')")).toBe(
        "(model.id === ctx.auth.userId) || (ctx.auth.hasRole('admin'))",
      );
    });

    it('should parenthesize AND expressions', () => {
      expect(generate("model.id === userId && hasRole('user')")).toBe(
        "(model.id === ctx.auth.userId) && (ctx.auth.hasRole('user'))",
      );
    });

    it('should handle nested logical expressions', () => {
      expect(
        generate(
          "model.id === userId || hasRole('admin') || hasRole('moderator')",
        ),
      ).toBe(
        "((model.id === ctx.auth.userId) || (ctx.auth.hasRole('admin'))) || (ctx.auth.hasRole('moderator'))",
      );
    });
  });
});

describe('generateQueryFilterExpressionCode', () => {
  describe('field comparisons', () => {
    it('should produce a Prisma where clause', () => {
      expect(generateQF('model.id === userId')).toBe('{ id: ctx.auth.userId }');
    });

    it('should handle different field names', () => {
      expect(generateQF('model.authorId === userId')).toBe(
        '{ authorId: ctx.auth.userId }',
      );
    });
  });

  describe('hasRole / hasSomeRole', () => {
    it('should produce boolean hasRole check', () => {
      expect(generateQF("hasRole('admin')")).toBe("ctx.auth.hasRole('admin')");
    });

    it('should produce boolean hasSomeRole check', () => {
      expect(generateQF("hasSomeRole(['admin', 'mod'])")).toBe(
        "ctx.auth.hasSomeRole(['admin', 'mod'])",
      );
    });
  });

  describe('isAuthenticated', () => {
    it('should produce isAuthenticated check', () => {
      expect(generateQF('isAuthenticated')).toBe('ctx.auth.isAuthenticated');
    });
  });

  describe('logical operators', () => {
    it('should use queryHelpers.or for || expressions', () => {
      expect(generateQF("model.id === userId || hasRole('admin')")).toBe(
        "queryHelpers.or([{ id: ctx.auth.userId }, ctx.auth.hasRole('admin')])",
      );
    });

    it('should use queryHelpers.and for && expressions', () => {
      expect(generateQF("model.id === userId && hasRole('admin')")).toBe(
        "queryHelpers.and([{ id: ctx.auth.userId }, ctx.auth.hasRole('admin')])",
      );
    });
  });

  describe('nested hasRole (query filter)', () => {
    const qfContext = {
      resolvedFilters: new Map([
        [
          'todoList',
          {
            relationFieldName: 'todoList',
            foreignModelName: 'TodoList',
            foreignQueryFilterVar: 'todoListQueryFilter',
          },
        ],
      ]),
    };

    it('should generate nested query filter call for hasRole', () => {
      const result = generateQF("hasRole(model.todoList, 'owner')", qfContext);
      expect(result).toBe(
        "todoListQueryFilter.buildNestedWhere(ctx, 'todoList', ['owner'])",
      );
    });

    it('should generate nested query filter call for hasSomeRole with single role', () => {
      const result = generateQF(
        "hasSomeRole(model.todoList, ['owner'])",
        qfContext,
      );
      expect(result).toBe(
        "todoListQueryFilter.buildNestedWhere(ctx, 'todoList', ['owner'])",
      );
    });

    it('should generate nested query filter call for hasSomeRole with multiple roles', () => {
      const result = generateQF(
        "hasSomeRole(model.todoList, ['owner', 'editor'])",
        qfContext,
      );
      expect(result).toBe(
        "todoListQueryFilter.buildNestedWhere(ctx, 'todoList', ['owner', 'editor'])",
      );
    });

    it('should combine nested query filter with logical operators', () => {
      const result = generateQF(
        "model.id === userId || hasRole(model.todoList, 'owner')",
        qfContext,
      );
      expect(result).toBe(
        "queryHelpers.or([{ id: ctx.auth.userId }, todoListQueryFilter.buildNestedWhere(ctx, 'todoList', ['owner'])])",
      );
    });

    it('should throw when nested ref used without context', () => {
      expect(() => generateQF("hasRole(model.todoList, 'owner')")).toThrow(
        /no code context was provided/,
      );
    });
  });
});
