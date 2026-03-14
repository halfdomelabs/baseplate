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
      expect(generateQF('model.id === userId')).toBe(
        '(ctx.auth.userId != null ? { id: ctx.auth.userId } : false)',
      );
    });

    it('should handle different field names', () => {
      expect(generateQF('model.authorId === userId')).toBe(
        '(ctx.auth.userId != null ? { authorId: ctx.auth.userId } : false)',
      );
    });

    it('should produce not-filter for !== with auth field', () => {
      expect(generateQF('model.id !== userId')).toBe(
        '(ctx.auth.userId != null ? { id: { not: ctx.auth.userId } } : false)',
      );
    });
  });

  describe('literal value comparisons', () => {
    it('should produce static where clause for === string literal', () => {
      expect(generateQF("model.status === 'active'")).toBe(
        "{ status: 'active' }",
      );
    });

    it('should produce not-filter for !== string literal', () => {
      expect(generateQF("model.status !== 'draft'")).toBe(
        "{ status: { not: 'draft' } }",
      );
    });

    it('should produce static where clause for === boolean literal', () => {
      expect(generateQF('model.isPublished === true')).toBe(
        '{ isPublished: true }',
      );
    });

    it('should produce static where clause for === number literal', () => {
      expect(generateQF('model.count === 42')).toBe('{ count: 42 }');
    });

    it('should produce static where clause when literal is on left side', () => {
      expect(generateQF("'active' === model.status")).toBe(
        "{ status: 'active' }",
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
        "queryHelpers.or([(ctx.auth.userId != null ? { id: ctx.auth.userId } : false), ctx.auth.hasRole('admin')])",
      );
    });

    it('should use queryHelpers.and for && expressions', () => {
      expect(generateQF("model.id === userId && hasRole('admin')")).toBe(
        "queryHelpers.and([(ctx.auth.userId != null ? { id: ctx.auth.userId } : false), ctx.auth.hasRole('admin')])",
      );
    });

    it('should flatten consecutive && into a single queryHelpers.and call', () => {
      expect(
        generateQF(
          "model.id === userId && hasRole('admin') && isAuthenticated",
        ),
      ).toBe(
        "queryHelpers.and([(ctx.auth.userId != null ? { id: ctx.auth.userId } : false), ctx.auth.hasRole('admin'), ctx.auth.isAuthenticated])",
      );
    });

    it('should flatten consecutive || into a single queryHelpers.or call', () => {
      expect(
        generateQF(
          "model.id === userId || hasRole('admin') || isAuthenticated",
        ),
      ).toBe(
        "queryHelpers.or([(ctx.auth.userId != null ? { id: ctx.auth.userId } : false), ctx.auth.hasRole('admin'), ctx.auth.isAuthenticated])",
      );
    });

    it('should not flatten across different operators', () => {
      expect(
        generateQF(
          "model.id === userId && hasRole('admin') || isAuthenticated",
        ),
      ).toBe(
        "queryHelpers.or([queryHelpers.and([(ctx.auth.userId != null ? { id: ctx.auth.userId } : false), ctx.auth.hasRole('admin')]), ctx.auth.isAuthenticated])",
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
        "queryHelpers.or([(ctx.auth.userId != null ? { id: ctx.auth.userId } : false), todoListQueryFilter.buildNestedWhere(ctx, 'todoList', ['owner'])])",
      );
    });

    it('should throw when nested ref used without context', () => {
      expect(() => generateQF("hasRole(model.todoList, 'owner')")).toThrow(
        /no code context was provided/,
      );
    });
  });

  describe('relation filter (exists/all)', () => {
    it('should generate exists with auth field condition (null guard)', () => {
      expect(generateQF('exists(model.members, { userId: userId })')).toBe(
        '(ctx.auth.userId != null ? { members: { some: { userId: ctx.auth.userId } } } : false)',
      );
    });

    it('should generate exists with literal condition (no null guard)', () => {
      expect(generateQF("exists(model.members, { type: 'admin' })")).toBe(
        "{ members: { some: { type: 'admin' } } }",
      );
    });

    it('should generate exists with multiple conditions', () => {
      expect(
        generateQF("exists(model.members, { userId: userId, type: 'admin' })"),
      ).toBe(
        "(ctx.auth.userId != null ? { members: { some: { userId: ctx.auth.userId, type: 'admin' } } } : false)",
      );
    });

    it('should generate all with literal condition', () => {
      expect(generateQF('all(model.tasks, { isCompleted: true })')).toBe(
        '{ tasks: { every: { isCompleted: true } } }',
      );
    });

    it('should generate all with auth field condition (null guard)', () => {
      expect(generateQF('all(model.tasks, { assigneeId: userId })')).toBe(
        '(ctx.auth.userId != null ? { tasks: { every: { assigneeId: ctx.auth.userId } } } : false)',
      );
    });

    it('should combine exists with logical operators', () => {
      expect(
        generateQF(
          "exists(model.members, { userId: userId }) || hasRole('admin')",
        ),
      ).toBe(
        "queryHelpers.or([(ctx.auth.userId != null ? { members: { some: { userId: ctx.auth.userId } } } : false), ctx.auth.hasRole('admin')])",
      );
    });

    it('should generate exists with boolean literal', () => {
      expect(generateQF('exists(model.tasks, { isPublic: true })')).toBe(
        '{ tasks: { some: { isPublic: true } } }',
      );
    });

    it('should generate exists with number literal', () => {
      expect(generateQF('exists(model.items, { quantity: 0 })')).toBe(
        '{ items: { some: { quantity: 0 } } }',
      );
    });
  });
});
