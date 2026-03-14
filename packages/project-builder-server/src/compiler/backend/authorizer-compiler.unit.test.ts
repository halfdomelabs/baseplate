import { parseAuthorizerExpression } from '@baseplate-dev/project-builder-lib';
import { describe, expect, it } from 'vitest';

import { generateAuthorizerExpressionCode } from './authorizer-compiler.js';

function generate(
  expression: string,
  codeContext?: Parameters<typeof generateAuthorizerExpressionCode>[1],
): string {
  const parsed = parseAuthorizerExpression(expression);
  return generateAuthorizerExpressionCode(parsed.ast, codeContext);
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

    it('should transform model field !== userId', () => {
      expect(generate('model.id !== userId')).toBe(
        'model.id !== ctx.auth.userId',
      );
    });
  });

  describe('literal value comparisons', () => {
    it('should transform model.status === string literal', () => {
      expect(generate("model.status === 'active'")).toBe(
        "model.status === 'active'",
      );
    });

    it('should transform model.isPublished === boolean literal', () => {
      expect(generate('model.isPublished === true')).toBe(
        'model.isPublished === true',
      );
    });

    it('should transform model.count === number literal', () => {
      expect(generate('model.count === 42')).toBe('model.count === 42');
    });

    it('should transform model.status !== string literal', () => {
      expect(generate("model.status !== 'draft'")).toBe(
        "model.status !== 'draft'",
      );
    });

    it('should transform literal on left side', () => {
      expect(generate("'active' === model.status")).toBe(
        "'active' === model.status",
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

  describe('relation filter (exists/all)', () => {
    const codeContext = {
      resolvedRelations: new Map(),
      resolvedRelationFilters: new Map([
        [
          'members',
          {
            prismaAccessor: 'brandMember',
            foreignKeyFieldName: 'brandId',
            localFieldName: 'id',
          },
        ],
        [
          'tasks',
          {
            prismaAccessor: 'task',
            foreignKeyFieldName: 'projectId',
            localFieldName: 'id',
          },
        ],
      ]),
    };

    it('should generate exists with auth field condition (null guard)', () => {
      expect(
        generate('exists(model.members, { userId: userId })', codeContext),
      ).toBe(
        '(ctx.auth.userId != null ? (await prisma.brandMember.count({ where: { brandId: model.id, userId: ctx.auth.userId } })) > 0 : false)',
      );
    });

    it('should generate exists with literal condition (no null guard)', () => {
      expect(
        generate("exists(model.members, { type: 'admin' })", codeContext),
      ).toBe(
        "(await prisma.brandMember.count({ where: { brandId: model.id, type: 'admin' } })) > 0",
      );
    });

    it('should generate exists with multiple conditions', () => {
      expect(
        generate(
          "exists(model.members, { userId: userId, type: 'admin' })",
          codeContext,
        ),
      ).toBe(
        "(ctx.auth.userId != null ? (await prisma.brandMember.count({ where: { brandId: model.id, userId: ctx.auth.userId, type: 'admin' } })) > 0 : false)",
      );
    });

    it('should generate all with literal condition', () => {
      expect(
        generate('all(model.tasks, { isCompleted: true })', codeContext),
      ).toBe(
        '(await prisma.task.count({ where: { projectId: model.id, NOT: { isCompleted: true } } })) === 0',
      );
    });

    it('should generate all with auth field condition', () => {
      expect(
        generate('all(model.tasks, { assigneeId: userId })', codeContext),
      ).toBe(
        '(await prisma.task.count({ where: { projectId: model.id, NOT: { assigneeId: ctx.auth.userId } } })) === 0',
      );
    });

    it('should combine exists with logical operators', () => {
      expect(
        generate(
          "exists(model.members, { userId: userId }) || hasRole('admin')",
          codeContext,
        ),
      ).toBe(
        "((ctx.auth.userId != null ? (await prisma.brandMember.count({ where: { brandId: model.id, userId: ctx.auth.userId } })) > 0 : false)) || (ctx.auth.hasRole('admin'))",
      );
    });

    it('should throw when relation filter used without context', () => {
      expect(() =>
        generate('exists(model.members, { userId: userId })'),
      ).toThrow(/no code context was provided/);
    });
  });
});
