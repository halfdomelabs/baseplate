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
    it('auth field userId → r.userMatch (no null-guard, guaranteed non-null)', () => {
      expect(lower('model.publisherId === userId')).toBe(
        'r.userMatch((session) => ({ publisherId: session.userId }))',
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

    it('!== against auth field userId falls back to r.userWhere (no null-guard)', () => {
      expect(lower('model.id !== userId')).toBe(
        'r.userWhere((session) => ({ id: { not: session.userId } }))',
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
        "r.some([r.userMatch((session) => ({ publisherId: session.userId })), r.hasRole('admin')])",
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
    it('exists(...) referencing only userId → r.userWhere (no null-guard)', () => {
      expect(lower('exists(model.members, { userId: userId })')).toBe(
        'r.userWhere((session) => ({ members: { some: { userId: session.userId } } }))',
      );
    });
  });

  describe('r.userMatch / r.userWhere — composition', () => {
    it('r.userMatch composes inside r.some with r.via', () => {
      expect(
        lower(
          "model.ownerId === userId || hasRole(model.blog, 'owner')",
          ctxWith({ blog: VIA_BLOG }),
        ),
      ).toBe(
        "r.some([r.userMatch((session) => ({ ownerId: session.userId })), r.via(blogPolicy, 'owner', { fk: 'blogId', relation: 'blog' })])",
      );
    });
  });
});
