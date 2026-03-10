import { parseAuthorizerExpression } from '@baseplate-dev/project-builder-lib';
import { describe, expect, it } from 'vitest';

import { generateQueryFilterExpressionCode } from './query-filter-compiler.js';

function generateQF(
  expression: string,
  codeContext?: Parameters<typeof generateQueryFilterExpressionCode>[1],
): string {
  const parsed = parseAuthorizerExpression(expression);
  return generateQueryFilterExpressionCode(parsed.ast, codeContext);
}

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
