import { parseAuthorizerExpression } from '@baseplate-dev/project-builder-lib';
import { describe, expect, it } from 'vitest';

import type {
  PolicyLoweringContext,
  ResolvedDelegationLink,
  ResolvedViaLink,
  ResolvedViaManyLink,
} from './policy-lowering.js';

import { lowerExpressionToRoleTree } from './policy-lowering.js';

// Local `blogId` → target `id` — deliberately NOT an identity mapping, since
// that's the normal case (`BlogPost.blogId` references `Blog.id`) and the one
// a naive "assume local name === target name" implementation gets wrong.
const VIA_BLOG: ResolvedViaLink = {
  cardinality: 'one',
  targetPolicyVar: 'blogPolicy',
  keys: { blogId: 'id' },
  relationName: 'blog',
};

const VIA_BLOG_USER: ResolvedViaLink = {
  cardinality: 'one',
  targetPolicyVar: 'blogUserPolicy',
  keys: { blogId: 'blogId', userId: 'userId' },
  relationName: 'blogUser',
};

// Reverse (has-many) link: Blog.members → BlogUser. No `keys` — a reverse
// relation has no local FK, so the relation name alone identifies it.
const VIA_MANY_MEMBERS: ResolvedViaManyLink = {
  cardinality: 'many',
  targetPolicyVar: 'blogUserPolicy',
  relationName: 'members',
};

function ctxWith(
  via: Record<string, ResolvedDelegationLink> = {},
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

    it('null literal → match', () => {
      expect(lower('model.deletedAt === null')).toBe(
        'r.match(() => ({ deletedAt: null }))',
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

    it('!== null falls back to r.where with a not-null filter', () => {
      expect(lower('model.engagementEffectiveAt !== null')).toBe(
        'r.where((ctx) => ({ engagementEffectiveAt: { not: null } }))',
      );
    });

    it('!== null composes with delegation across a relation', () => {
      expect(
        lower(
          'model.engagementEffectiveAt !== null && hasRole(model.members, "owner")',
          ctxWith({ members: VIA_MANY_MEMBERS }),
        ),
      ).toBe(
        'r.all([r.where((ctx) => ({ engagementEffectiveAt: { not: null } })), ' +
          "r.viaMany(blogUserPolicy, 'owner', 'members')])",
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
    it('nestedHasRole → r.via with relation/keys (local field → TARGET field, not identity)', () => {
      expect(
        lower("hasRole(model.blog, 'owner')", ctxWith({ blog: VIA_BLOG })),
      ).toBe(
        "r.via(blogPolicy, 'owner', { relation: 'blog', keys: { 'blogId': 'id' } })",
      );
    });

    it('nestedHasSomeRole with multiple roles → r.some of vias', () => {
      expect(
        lower(
          "hasSomeRole(model.blog, ['owner', 'editor'])",
          ctxWith({ blog: VIA_BLOG }),
        ),
      ).toBe(
        "r.some([r.via(blogPolicy, 'owner', { relation: 'blog', keys: { 'blogId': 'id' } }), r.via(blogPolicy, 'editor', { relation: 'blog', keys: { 'blogId': 'id' } })])",
      );
    });

    it('nestedHasRole through a composite FK → r.via with multi-field keys map', () => {
      expect(
        lower(
          "hasRole(model.blogUser, 'owner')",
          ctxWith({ blogUser: VIA_BLOG_USER }),
        ),
      ).toBe(
        "r.via(blogUserPolicy, 'owner', { relation: 'blogUser', keys: { 'blogId': 'blogId', 'userId': 'userId' } })",
      );
    });
  });

  describe('r.viaMany — to-many (reverse relation) delegation', () => {
    it('nestedHasRole on a reverse relation → r.viaMany (relation name only, no keys)', () => {
      expect(
        lower(
          "hasRole(model.members, 'owner')",
          ctxWith({ members: VIA_MANY_MEMBERS }),
        ),
      ).toBe("r.viaMany(blogUserPolicy, 'owner', 'members')");
    });

    it('nestedHasSomeRole on a reverse relation → r.some of viaMany', () => {
      expect(
        lower(
          "hasSomeRole(model.members, ['owner', 'editor'])",
          ctxWith({ members: VIA_MANY_MEMBERS }),
        ),
      ).toBe(
        "r.some([r.viaMany(blogUserPolicy, 'owner', 'members'), r.viaMany(blogUserPolicy, 'editor', 'members')])",
      );
    });

    it('mixed cardinalities in one expression each render their own form', () => {
      // The same expression can delegate to-one and to-many; cardinality is
      // per-link, resolved from the schema, not per-expression.
      expect(
        lower(
          "hasRole(model.blog, 'owner') || hasRole(model.members, 'owner')",
          ctxWith({ blog: VIA_BLOG, members: VIA_MANY_MEMBERS }),
        ),
      ).toBe(
        "r.some([r.via(blogPolicy, 'owner', { relation: 'blog', keys: { 'blogId': 'id' } }), r.viaMany(blogUserPolicy, 'owner', 'members')])",
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

    it('exists(...) with a null condition value → r.where', () => {
      expect(lower('exists(model.members, { deletedAt: null })')).toBe(
        'r.where((ctx) => ({ members: { some: { deletedAt: null } } }))',
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
        "r.some([r.userMatch((session) => ({ ownerId: session.userId })), r.via(blogPolicy, 'owner', { relation: 'blog', keys: { 'blogId': 'id' } })])",
      );
    });
  });
});
