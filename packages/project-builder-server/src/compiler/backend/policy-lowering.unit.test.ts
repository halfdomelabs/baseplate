import { parseAuthorizerExpression } from '@baseplate-dev/project-builder-lib';
import { describe, expect, it } from 'vitest';

import type {
  PolicyLoweringContext,
  ResolvedViaLink,
} from './policy-lowering.js';

import { lowerExpressionToRoleTree } from './policy-lowering.js';

const VIA_BLOG: ResolvedViaLink = {
  targetPolicyVar: 'blogPolicy',
  fkFieldName: 'blogId',
  relationName: 'blog',
};

function ctxWith(
  via: Record<string, ResolvedViaLink> = {},
): PolicyLoweringContext {
  return { resolvedVia: new Map(Object.entries(via)) };
}

function lower(
  expression: string,
  ctx: PolicyLoweringContext = ctxWith(),
): string {
  const parsed = parseAuthorizerExpression(expression);
  return lowerExpressionToRoleTree(parsed.ast, ctx);
}

describe('lowerExpressionToRoleTree', () => {
  describe('r.match — scalar equality (===)', () => {
    it('auth field → null-guarded match', () => {
      expect(lower('model.publisherId === userId')).toBe(
        'r.match((ctx) => (ctx.auth.userId != null ? { publisherId: ctx.auth.userId } : false))',
      );
    });

    it('string literal → unguarded match', () => {
      expect(lower("model.status === 'PUBLISHED'")).toBe(
        "r.match(() => ({ status: 'PUBLISHED' }))",
      );
    });

    it('boolean literal → match', () => {
      expect(lower('model.isPublished === true')).toBe(
        'r.match(() => ({ isPublished: true }))',
      );
    });

    it('model-vs-model comparison is NOT matchable → throws (never emits an out-of-scope `model` ref)', () => {
      // Both sides are model fields, so `r.match` can't bind one to a scalar.
      // It falls through to the where fallback, which rejects the comparison
      // rather than emitting `() => ({ a: model.b })` (a runtime ReferenceError).
      expect(() => lower('model.publisherId === model.authorId')).toThrow(
        /model field/i,
      );
    });
  });

  describe('r.where — fallback for non-matchable comparisons', () => {
    it('!== falls back to r.where', () => {
      expect(lower("model.status !== 'draft'")).toBe(
        "r.where((ctx) => ({ status: { not: 'draft' } }))",
      );
    });

    it('!== against auth field falls back to r.where (null-guarded)', () => {
      expect(lower('model.id !== userId')).toBe(
        'r.where((ctx) => (ctx.auth.userId != null ? { id: { not: ctx.auth.userId } } : false))',
      );
    });
  });

  describe('r.hasRole / r.authenticated — global leaves', () => {
    it('hasRole', () => {
      expect(lower("hasRole('admin')")).toBe("r.hasRole('admin')");
    });

    it('hasSomeRole → hasRole with multiple', () => {
      expect(lower("hasSomeRole(['admin', 'moderator'])")).toBe(
        "r.hasRole('admin', 'moderator')",
      );
    });

    it('isAuthenticated → r.authenticated', () => {
      expect(lower('isAuthenticated')).toBe('r.authenticated()');
    });
  });

  describe('r.via — to-one delegation', () => {
    it('nestedHasRole → r.via with fk/relation', () => {
      expect(
        lower("hasRole(model.blog, 'owner')", ctxWith({ blog: VIA_BLOG })),
      ).toBe("r.via(blogPolicy, 'owner', { fk: 'blogId', relation: 'blog' })");
    });

    it('nestedHasSomeRole with multiple roles → r.some of vias', () => {
      expect(
        lower(
          "hasSomeRole(model.blog, ['owner', 'editor'])",
          ctxWith({ blog: VIA_BLOG }),
        ),
      ).toBe(
        "r.some([r.via(blogPolicy, 'owner', { fk: 'blogId', relation: 'blog' }), r.via(blogPolicy, 'editor', { fk: 'blogId', relation: 'blog' })])",
      );
    });
  });

  describe('r.all / r.some — combinators (recursive)', () => {
    it('&& → r.all', () => {
      expect(lower("model.status === 'PINNED' && hasRole('admin')")).toBe(
        "r.all([r.match(() => ({ status: 'PINNED' })), r.hasRole('admin')])",
      );
    });

    it('|| → r.some', () => {
      expect(lower("model.publisherId === userId || hasRole('admin')")).toBe(
        "r.some([r.match((ctx) => (ctx.auth.userId != null ? { publisherId: ctx.auth.userId } : false)), r.hasRole('admin')])",
      );
    });

    it('flattens same-operator chains: A && B && C → one r.all', () => {
      expect(
        lower(
          "model.status === 'PINNED' && model.isPublished === true && hasRole('admin')",
        ),
      ).toBe(
        "r.all([r.match(() => ({ status: 'PINNED' })), r.match(() => ({ isPublished: true })), r.hasRole('admin')])",
      );
    });

    it('nests mixed operators: (A && B) || C → r.some([r.all([...]), C])', () => {
      expect(
        lower(
          "model.status === 'PINNED' && model.isPublished === true || hasRole('admin')",
        ),
      ).toBe(
        "r.some([r.all([r.match(() => ({ status: 'PINNED' })), r.match(() => ({ isPublished: true }))]), r.hasRole('admin')])",
      );
    });
  });

  describe('r.where — relation membership fallback', () => {
    it('exists(...) → r.where with { some }', () => {
      // The where-body already starts with `(` (the null-guard ternary), so the
      // asWhere wrapper does not add redundant parens.
      expect(lower('exists(model.members, { userId: userId })')).toBe(
        'r.where((ctx) => (ctx.auth.userId != null ? { members: { some: { userId: ctx.auth.userId } } } : false))',
      );
    });
  });
});
