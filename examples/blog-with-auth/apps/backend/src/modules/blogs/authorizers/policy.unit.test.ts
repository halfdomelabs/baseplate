import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServiceContext } from '@src/utils/service-context.js';

import { createAuthContextFromSessionInfo } from '@src/modules/accounts/auth/utils/auth-context.utils.js';

// blog.count is the probe target (viewer membership); blog.findUnique would be
// the cached-load path — under derived-check-via-delegation, the blog
// COUNT (probe) is what fires, keyed on blogId, so N posts → 1.
const blogCount = vi.fn();
const blogPostCount = vi.fn();
const blogUserCount = vi.fn();
vi.mock('@src/services/prisma.js', () => ({
  prisma: {
    blog: {
      count: (...a: unknown[]): unknown => blogCount(...a),
      findUnique: vi.fn(),
    },
    blogPost: { count: (...a: unknown[]): unknown => blogPostCount(...a) },
    blogUser: { count: (...a: unknown[]): unknown => blogUserCount(...a) },
  },
}));

const { prisma } = await import('@src/services/prisma.js');
const { createModelPolicy } = await import('@src/utils/authorizers.js');
const { blogPolicy } = await import('./blog.policy.js');
const { blogPostPolicy } = await import('./blog-post.policy.js');

// Test-only policy carrying demo roles (`myPinnedPost` = multi-condition
// `r.match`, `pinnedByBlogOwner` = `r.all([match, via])`). These exercise runtime
// behaviors the generated `blogPostPolicy` doesn't declare — they live here, not
// in the generated policy, so the example stays exactly what the generator emits.
const blogPostPolicyExtended = createModelPolicy({
  model: 'blogPost',
  idField: 'id',
  delegate: prisma.blogPost,
  superuser: ['admin'],
  roles: (r) => ({
    owner: r.via(blogPolicy, 'owner', { fk: 'blogId', relation: 'blog' }),
    myPinnedPost: r.match((ctx) =>
      ctx.auth.userId != null
        ? { publisherId: ctx.auth.userId, title: 'PINNED' }
        : false,
    ),
    pinnedByBlogOwner: r.all([
      r.match(() => ({ title: 'PINNED' })),
      r.via(blogPolicy, 'owner', { fk: 'blogId', relation: 'blog' }),
    ]),
  }),
  actions: {
    read: { roles: ['myPinnedPost', 'pinnedByBlogOwner'] },
    // Owner-instance mutations — exercises whereUnique AND-composition through a
    // via delegation. The generated blogPostPolicy gates mutations on admin
    // globals; this test-only policy carries the instance-role variant.
    update: { roles: ['owner'] },
    delete: { roles: ['owner'] },
  },
});

const USER_ID = 'user-1';

function makeCtx(userId: string | undefined): ServiceContext {
  return {
    auth: createAuthContextFromSessionInfo(
      userId != null
        ? { id: 's', type: 'user', userId, roles: ['user'] }
        : undefined,
    ),
    authorizerCache: new Map(),
    authorizerModelCache: new Map(),
  };
}

/** Like `makeCtx` but with arbitrary global roles, for `r.hasRole` tests. */
function ctxWithRoles(
  userId: string | undefined,
  roles: ('user' | 'admin')[],
): ServiceContext {
  return {
    auth: createAuthContextFromSessionInfo(
      userId != null ? { id: 's', type: 'user', userId, roles } : undefined,
    ),
    authorizerCache: new Map(),
    authorizerModelCache: new Map(),
  };
}

beforeEach(() => {
  blogCount.mockReset();
  blogPostCount.mockReset();
  blogUserCount.mockReset();
});

describe('single-source: derived check for local scalar (owner)', () => {
  it('owner derived check evaluates in-memory — NO db query', async () => {
    const ctx = makeCtx(USER_ID);
    const ok = await blogPolicy.roles.owner.check(ctx, {
      id: 'blog-1',
      userId: USER_ID,
    } as never);
    const no = await blogPolicy.roles.owner.check(ctx, {
      id: 'blog-2',
      userId: 'someone-else',
    } as never);

    expect(ok).toBe(true);
    expect(no).toBe(false);
    // Pure in-memory scalar match — the probe never fires.
    expect(blogCount).not.toHaveBeenCalled();
  });
});

describe('single-source: viewer authored as ONE where (no hand-written count)', () => {
  it('viewer derived check probes on blog own id; member → allow', async () => {
    blogCount.mockResolvedValue(1); // membership probe hits
    const ctx = makeCtx(USER_ID);
    const ok = await blogPolicy.roles.viewer.check(ctx, {
      id: 'blog-1',
      userId: 'someone-else',
    } as never);
    expect(ok).toBe(true);
    expect(blogCount).toHaveBeenCalledTimes(1);
  });

  it('viewer unauthenticated → deny, no probe', async () => {
    const ctx = makeCtx(undefined);
    const no = await blogPolicy.roles.viewer.check(ctx, {
      id: 'blog-1',
      userId: 'x',
    } as never);
    expect(no).toBe(false);
    expect(blogCount).not.toHaveBeenCalled();
  });
});

describe('r.match: multi-condition scalar equality (declared zero-query)', () => {
  it('matches only when BOTH conditions hold — fully in-memory, no query', async () => {
    const ctx = makeCtx(USER_ID);

    // both: publisher is me AND title === 'PINNED'
    const both = await blogPostPolicyExtended.roles.myPinnedPost.check(ctx, {
      id: 'p1',
      publisherId: USER_ID,
      title: 'PINNED',
    } as never);
    // right publisher, wrong title
    const wrongTitle = await blogPostPolicyExtended.roles.myPinnedPost.check(
      ctx,
      {
        id: 'p2',
        publisherId: USER_ID,
        title: 'draft',
      } as never,
    );
    // right title, wrong publisher
    const wrongPub = await blogPostPolicyExtended.roles.myPinnedPost.check(
      ctx,
      {
        id: 'p3',
        publisherId: 'someone-else',
        title: 'PINNED',
      } as never,
    );

    expect(both).toBe(true);
    expect(wrongTitle).toBe(false);
    expect(wrongPub).toBe(false);
    // Two scalar keys ANDed in-memory — no DB round trip at all.
    expect(blogPostCount).not.toHaveBeenCalled();
    expect(blogCount).not.toHaveBeenCalled();
  });
});

describe('r.match: unconditional deny (false) short-circuits with no query', () => {
  it('unauthenticated myPinnedPost → false, no probe', async () => {
    // `r.match` returns `false` when unauthenticated — a hard deny, no DB.
    const ctx = makeCtx(undefined);
    const no = await blogPostPolicyExtended.roles.myPinnedPost.check(ctx, {
      id: 'p1',
      publisherId: USER_ID,
      title: 'PINNED',
    } as never);
    expect(no).toBe(false);
    expect(blogPostCount).not.toHaveBeenCalled();
    expect(blogCount).not.toHaveBeenCalled();
  });
});

describe('r.match: where-form equals the match object (duality by construction)', () => {
  it('nestedWhere emits the match object verbatim (same fields, equality)', () => {
    // A match role has NO heuristic: its Prisma filter IS its object. Delegation
    // nesting wraps it under the relation key, unchanged. This is why check and
    // where agree — they are the SAME object, not two interpretations of it.
    const ctx = makeCtx(USER_ID);
    const nested = blogPostPolicyExtended.roles.myPinnedPost.nestedWhere(
      ctx,
      'post',
    );
    expect(nested).toEqual({
      post: { publisherId: USER_ID, title: 'PINNED' },
    });
  });
});

describe('r.match: runtime guard rejects a non-scalar value (bypassed TS)', async () => {
  const { createModelPolicy } = await import('@src/utils/authorizers.js');

  it('an object value in a match → throws (scalar-equality only)', async () => {
    // TypeScript forbids this via `LocalMatch`, but a caller bypassing types
    // (`as never`) must still be caught at runtime, not silently mis-decided.
    const policy = createModelPolicy({
      model: 'blogPost',
      idField: 'id',
      delegate: prisma.blogPost,
      roles: (r) => ({
        bad: r.match(() => ({ title: { some: 'x' } }) as never),
      }),
      actions: { read: { roles: ['bad'] } },
    });
    await expect(
      policy.roles.bad.check(makeCtx(USER_ID), {
        id: 'p1',
        title: 'x',
      } as never),
    ).rejects.toThrow(/scalar-equality only/);
  });

  it('an `undefined` field in a match → throws on the WHERE path too (match-all vector)', () => {
    // The load-bearing case: `{ userId: undefined }` reaches Prisma as an
    // OMITTED field → matches EVERY row. The guard must fire on the where path
    // (not just `.check`), so `read.where` — which returns the match object —
    // throws before that object can reach the DB.
    const policy = createModelPolicy({
      model: 'blogPost',
      idField: 'id',
      delegate: prisma.blogPost,
      roles: (r) => ({
        bad: r.match(() => ({ publisherId: undefined }) as never),
      }),
      actions: { read: { roles: ['bad'] } },
    });
    expect(() => policy.read.where(makeCtx(USER_ID))).toThrow(/undefined/);
  });

  it('an `r.where` returning `undefined` → throws (would read as allow-all)', () => {
    // `undefined` means UNRESTRICTED downstream; a deny-intending role must fail
    // loud, not silently authorize everyone. (NonNullable makes this a compile
    // error at authoring; this covers the bypassed-types path.)
    const policy = createModelPolicy({
      model: 'blogPost',
      idField: 'id',
      delegate: prisma.blogPost,
      roles: (r) => ({
        bad: r.where(() => undefined as never),
      }),
      actions: { read: { roles: ['bad'] } },
    });
    expect(() => policy.read.where(makeCtx(USER_ID))).toThrow(/undefined/);
  });
});

describe('delegation: nestedWhere nests to-one directly', () => {
  it('emits { relation: w } (via is to-one only — no { some } wrapping)', () => {
    const ctx = makeCtx(USER_ID);
    // blog.owner.where(ctx) = { userId }
    const nested = blogPolicy.roles.owner.nestedWhere(ctx, 'blog');
    expect(nested).toEqual({ blog: { userId: USER_ID } });
    // NOTE: to-many `via` is deliberately disallowed (type-level) — it can't be
    // parent-key-cached, so it would just be a slower `r.where({rel:{some}})`.
    // The `{ some }` form, when wanted, is authored directly as a relation
    // predicate in `r.where`, not via delegation.
  });
});

describe('whereUnique: composes the grant into a unique selector (atomic mutation)', () => {
  it('AND-nests the auth filter into { id } (single-role grant)', () => {
    // blogPost.update = { roles: ['owner'] }; owner is a via → nested blog.owner
    // where. whereUnique must AND that into the caller's { id }, never spread it,
    // so the unique key survives and the auth filter can't be clobbered.
    const ctx = makeCtx(USER_ID);
    const w = blogPostPolicyExtended.update.whereUnique(ctx, { id: 'post-1' });
    expect(w).toEqual({
      id: 'post-1',
      AND: [{ blog: { userId: USER_ID } }],
    });
  });

  it('superuser → no auth restriction → selector returned untouched', () => {
    // admin folds into every grant; the grant imposes no filter, so whereUnique
    // returns the bare unique selector (still a valid atomic mutation target).
    const ctx: ServiceContext = {
      auth: createAuthContextFromSessionInfo({
        id: 's',
        type: 'user',
        userId: USER_ID,
        roles: ['admin'],
      }),
      authorizerCache: new Map(),
      authorizerModelCache: new Map(),
    };
    const w = blogPostPolicyExtended.update.whereUnique(ctx, { id: 'post-1' });
    expect(w).toEqual({ id: 'post-1' });
  });

  it("APPENDS to the caller's existing AND (never clobbers a business invariant)", () => {
    // A caller-supplied `AND` (e.g. a status guard) must survive — the auth
    // filter is appended, not substituted.
    const ctx = makeCtx(USER_ID);
    const w = blogPostPolicyExtended.update.whereUnique(ctx, {
      id: 'post-1',
      AND: [{ title: 'DRAFT' }],
    });
    expect(w).toEqual({
      id: 'post-1',
      AND: [{ title: 'DRAFT' }, { blog: { userId: USER_ID } }],
    });
  });

  it('unconditional deny → throws before any query (ForbiddenError)', () => {
    // Unauthenticated: owner's via resolves to `false`, the only update role, so
    // the grant denies unconditionally → whereUnique throws rather than emit a
    // where that would silently match nothing.
    const ctx = makeCtx(undefined);
    expect(() =>
      blogPostPolicyExtended.update.whereUnique(ctx, { id: 'post-1' }),
    ).toThrow(/Forbidden/);
  });
});

describe('fan-out: derived check via CACHED delegation stays 1 query', () => {
  it('N posts sharing one blog → ONE probe (keyed on blogId, cached)', async () => {
    // blogPost.owner delegates to blog.owner.checkById(blogId). blog.owner is a
    // local scalar, so checkById probes blog by id — ONCE, then cached.
    blogCount.mockResolvedValue(1); // the shared blog is owned
    const ctx = makeCtx(USER_ID);
    const posts = Array.from({ length: 25 }, (_, i) => ({
      id: `post-${i}`,
      blogId: 'blog-1',
    }));

    const results = [];
    for (const p of posts) {
      results.push(await blogPostPolicy.roles.owner.check(ctx, p as never));
    }

    expect(results.every(Boolean)).toBe(true);
    // The KEY RESULT: 25 posts, one shared blog → 1 probe, not 25.
    expect(blogCount).toHaveBeenCalledTimes(1);
    // And blogPost was never probed at the child level (delegation, not flatten).
    expect(blogPostCount).not.toHaveBeenCalled();
  });

  it('CONCURRENT (Promise.all) N posts sharing one blog → still ONE probe', async () => {
    // This is the condition GraphQL actually creates: per-row field auth
    // (canEdit on every item in a list) resolves in PARALLEL. Without an
    // in-flight promise cache, all N miss the empty cache and all probe.
    // With it, callers 2..N coalesce onto the same in-flight probe.
    blogCount.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            resolve(1);
          }, 5),
        ),
    );
    const ctx = makeCtx(USER_ID);
    const posts = Array.from({ length: 25 }, (_, i) => ({
      id: `post-${i}`,
      blogId: 'blog-1',
    }));

    const results = await Promise.all(
      posts.map((p) => blogPostPolicy.roles.owner.check(ctx, p as never)),
    );

    expect(results.every(Boolean)).toBe(true);
    expect(blogCount).toHaveBeenCalledTimes(1); // coalesced, not 25
  });

  it('a rejected probe is evicted (not cached) so later checks can retry', async () => {
    const ctx = makeCtx(USER_ID);
    const post = { id: 'post-x', blogId: 'blog-err' };

    blogCount.mockRejectedValueOnce(new Error('db blip'));
    await expect(
      blogPostPolicy.roles.owner.check(ctx, post as never),
    ).rejects.toThrow('db blip');

    // The failed probe must NOT poison the cache — a retry re-probes and succeeds.
    blogCount.mockResolvedValueOnce(1);
    const retry = await blogPostPolicy.roles.owner.check(ctx, post as never);
    expect(retry).toBe(true);
    expect(blogCount).toHaveBeenCalledTimes(2); // failed + successful retry
  });
});

describe('r.all: conjunction of local match AND cached via', () => {
  it('match conjunct FAILS → false with ZERO queries (cheapest-first)', async () => {
    // pinnedByBlogOwner = all([ match(title:PINNED), via(blog.owner) ]).
    // A non-pinned post fails the local match first → no blog probe at all.
    blogCount.mockResolvedValue(1);
    const ctx = makeCtx(USER_ID);
    const notPinned = { id: 'p1', blogId: 'blog-1', title: 'draft' };

    const result = await blogPostPolicyExtended.roles.pinnedByBlogOwner.check(
      ctx,
      notPinned as never,
    );

    expect(result).toBe(false);
    expect(blogCount).not.toHaveBeenCalled(); // short-circuited before delegation
  });

  it('local passes → delegates; N pinned posts of one blog → ONE query', async () => {
    // The whole point of r.all over inlining: the via part keeps parent-keyed
    // caching, so N pinned siblings sharing one blog collapse to 1 probe.
    blogCount.mockResolvedValue(1); // blog is owned
    const ctx = makeCtx(USER_ID);
    const pinned = Array.from({ length: 25 }, (_, i) => ({
      id: `post-${i}`,
      blogId: 'blog-1',
      title: 'PINNED',
    }));

    const results = [];
    for (const p of pinned) {
      results.push(
        await blogPostPolicyExtended.roles.pinnedByBlogOwner.check(
          ctx,
          p as never,
        ),
      );
    }

    expect(results.every(Boolean)).toBe(true);
    expect(blogCount).toHaveBeenCalledTimes(1); // parent-keyed cache held
    expect(blogPostCount).not.toHaveBeenCalled(); // no child-keyed self-probe
  });

  it('local passes but delegation FAILS → false', async () => {
    blogCount.mockResolvedValue(0); // blog NOT owned
    const ctx = makeCtx(USER_ID);
    const pinned = { id: 'p1', blogId: 'blog-1', title: 'PINNED' };
    expect(
      await blogPostPolicyExtended.roles.pinnedByBlogOwner.check(
        ctx,
        pinned as never,
      ),
    ).toBe(false);
  });

  it('r.all([]) → throws at construction (empty conjunction is allow-all)', async () => {
    // The tuple type makes `r.all([])` a compile error; this covers the bypassed
    // runtime path — an empty conjunction must never silently become allow-all.
    const { createModelPolicy } = await import('@src/utils/authorizers.js');
    expect(() =>
      createModelPolicy({
        model: 'blogPost',
        idField: 'id',
        delegate: prisma.blogPost,
        roles: (r) => ({ bad: r.all([] as never) }),
        actions: { read: { roles: ['bad'] } },
      }),
    ).toThrow(/at least one part/);
  });
});

describe('r.some (OR) + r.hasRole leaf + nesting', async () => {
  const { createModelPolicy } = await import('@src/utils/authorizers.js');

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function buildPolicy() {
    return createModelPolicy({
      model: 'blogPost',
      idField: 'id',
      delegate: prisma.blogPost,
      roles: (r) => ({
        // `owner || admin` — the || case: r.some of a match leaf and a hasRole leaf.
        ownerOrAdmin: r.some([
          r.match((ctx) =>
            ctx.auth.userId != null ? { publisherId: ctx.auth.userId } : false,
          ),
          r.hasRole('admin'),
        ]),
        // `(pinned && mine) || admin` — nesting: r.some containing an r.all.
        nested: r.some([
          r.all([
            r.match(() => ({ title: 'PINNED' })),
            r.match((ctx) =>
              ctx.auth.userId != null
                ? { publisherId: ctx.auth.userId }
                : false,
            ),
          ]),
          r.hasRole('admin'),
        ]),
      }),
      actions: {
        read: { roles: ['ownerOrAdmin', 'nested'] },
        update: { roles: ['ownerOrAdmin'] },
        // single-role action isolating `nested` for its where-form assertion
        delete: { roles: ['nested'] },
      },
    });
  }

  it('r.some check: first passing part grants (cheapest-first, no probe)', async () => {
    const policy = buildPolicy();
    // Not the owner, but IS admin → the hasRole leaf grants. Zero DB.
    const ok = await policy.roles.ownerOrAdmin.check(
      ctxWithRoles('someone-else', ['admin']),
      { id: 'p1', publisherId: USER_ID } as never,
    );
    expect(ok).toBe(true);
    expect(blogPostCount).not.toHaveBeenCalled();
  });

  it('r.some check: owner match grants when not admin', async () => {
    const policy = buildPolicy();
    const ok = await policy.roles.ownerOrAdmin.check(
      ctxWithRoles(USER_ID, ['user']),
      { id: 'p1', publisherId: USER_ID } as never,
    );
    expect(ok).toBe(true);
  });

  it('r.some check: neither part → deny', async () => {
    const policy = buildPolicy();
    const no = await policy.roles.ownerOrAdmin.check(
      ctxWithRoles('someone-else', ['user']),
      { id: 'p1', publisherId: USER_ID } as never,
    );
    expect(no).toBe(false);
  });

  it('r.some where: hasRole short-circuit drops (non-admin) or grants (admin)', () => {
    const policy = buildPolicy();
    // `update` grant is only `ownerOrAdmin`, isolating that one role's where.
    // Non-admin → hasRole('admin') folds to false and drops; a single-element OR
    // unwraps → just the match filter.
    expect(policy.update.where(ctxWithRoles(USER_ID, ['user']))).toEqual({
      publisherId: USER_ID,
    });
    // Admin → hasRole('admin') folds to true → unrestricted (undefined).
    expect(
      policy.update.where(ctxWithRoles(USER_ID, ['admin'])),
    ).toBeUndefined();
  });

  it('nested some([all([...]), hasRole]) check: the inner AND path grants', async () => {
    const policy = buildPolicy();
    // pinned AND mine, not admin → the inner r.all grants.
    const ok = await policy.roles.nested.check(
      ctxWithRoles(USER_ID, ['user']),
      {
        id: 'p1',
        title: 'PINNED',
        publisherId: USER_ID,
      } as never,
    );
    expect(ok).toBe(true);
  });

  it('nested where: inner all(match,match) → AND inside the OR (admin present)', () => {
    const policy = buildPolicy();
    // `delete` grant is only `nested` = some([ all([match,match]), hasRole ]).
    // As admin, BOTH parts contribute → a real 2-element OR: the inner AND and
    // the admin short-circuit (`true`). queryHelpers.or short-circuits on `true`
    // → unrestricted (undefined).
    expect(
      policy.delete.where(ctxWithRoles(USER_ID, ['admin'])),
    ).toBeUndefined();
    // As non-admin: admin leaf drops → single-element OR unwraps → the inner AND.
    expect(policy.delete.where(ctxWithRoles(USER_ID, ['user']))).toEqual({
      AND: [{ title: 'PINNED' }, { publisherId: USER_ID }],
    });
  });

  it('r.authenticated: logged-in grants, anonymous denies (both paths)', async () => {
    const policy = createModelPolicy({
      model: 'blogPost',
      idField: 'id',
      delegate: prisma.blogPost,
      roles: (r) => ({ loggedIn: r.authenticated() }),
      actions: { read: { roles: ['loggedIn'] } },
    });
    // check: authenticated → true, anonymous → false
    expect(
      await policy.roles.loggedIn.check(ctxWithRoles(USER_ID, ['user']), {
        id: 'p1',
      } as never),
    ).toBe(true);
    expect(
      await policy.roles.loggedIn.check(ctxWithRoles(undefined, []), {
        id: 'p1',
      } as never),
    ).toBe(false);
    // where: authenticated → unrestricted (undefined); anonymous → deny (throws)
    expect(policy.read.where(ctxWithRoles(USER_ID, ['user']))).toBeUndefined();
    expect(() => policy.read.where(ctxWithRoles(undefined, []))).toThrow(
      /Forbidden/,
    );
  });

  it('r.some([]) → throws (fails safe as deny, but still rejected)', () => {
    expect(() =>
      createModelPolicy({
        model: 'blogPost',
        idField: 'id',
        delegate: prisma.blogPost,
        roles: (r) => ({ bad: r.some([] as never) }),
        actions: { read: { roles: ['bad'] } },
      }),
    ).toThrow(/at least one part/);
  });
});

describe('r.check + cachedSet: batch scoped-RBAC (team roles)', async () => {
  const { createModelPolicy, cachedSet } =
    await import('@src/utils/authorizers.js');

  // Simulates "one query loads all my memberships, then each role is a lookup".
  // A blog stands in for a team; findMemberships is the single membership query.
  const findMemberships = vi.fn();

  const resolveRoles = (
    ctx: ServiceContext,
    teamId: string,
  ): Promise<Set<string>> =>
    cachedSet(ctx, `blog-roles:${teamId}`, async () => {
      const rows = (await findMemberships(teamId)) as { role: string }[];
      return new Set(rows.map((r) => r.role));
    });

  // Return type is the (complex, generic) policy object — inferred; annotating it
  // by hand adds no value in a test helper.
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function buildTeamPolicy() {
    return createModelPolicy({
      model: 'blog',
      idField: 'id',
      delegate: prisma.blog,
      roles: (r) => ({
        teamAdmin: r.check((ctx, m) =>
          resolveRoles(ctx, m.id).then((s) => s.has('ADMIN')),
        ),
        teamEditor: r.check((ctx, m) =>
          resolveRoles(ctx, m.id).then((s) => s.has('EDITOR')),
        ),
        teamViewer: r.check((ctx, m) =>
          resolveRoles(ctx, m.id).then((s) => s.has('VIEWER')),
        ),
      }),
      actions: {
        read: { roles: [] },
        update: { roles: ['teamAdmin'] },
        delete: { roles: ['teamAdmin'] },
      },
    });
  }

  beforeEach(() => findMemberships.mockReset());

  it('3 DISTINCT role checks on one team → ONE membership query', async () => {
    findMemberships.mockResolvedValue([{ role: 'EDITOR' }]);
    const ctx = makeCtx(USER_ID);
    const policy = buildTeamPolicy();
    const team = { id: 'team-1' };

    const admin = await policy.roles.teamAdmin.check(ctx, team as never);
    const editor = await policy.roles.teamEditor.check(ctx, team as never);
    const viewer = await policy.roles.teamViewer.check(ctx, team as never);

    expect(admin).toBe(false);
    expect(editor).toBe(true); // user is an EDITOR
    expect(viewer).toBe(false);
    // The KEY RESULT: 3 distinct role checks, ONE query (shared resolver).
    expect(findMemberships).toHaveBeenCalledTimes(1);
  });

  it('N teams → N queries; N checks per team share within the team', async () => {
    findMemberships.mockResolvedValue([{ role: 'ADMIN' }]);
    const ctx = makeCtx(USER_ID);
    const policy = buildTeamPolicy();

    for (const id of ['team-a', 'team-b']) {
      await policy.roles.teamAdmin.check(ctx, { id } as never);
      await policy.roles.teamEditor.check(ctx, { id } as never);
    }
    // 2 teams × (admin+editor) = 4 checks, but 1 query per team = 2 total.
    expect(findMemberships).toHaveBeenCalledTimes(2);
  });

  it('check-only role in a read/where path throws (guarded)', () => {
    const policy = buildTeamPolicy();
    const ctx = makeCtx(USER_ID);
    // teamAdmin has no where form — asking for it (e.g. read action filter) fails.
    expect(() =>
      (
        policy.roles.teamAdmin as {
          nestedWhere: (c: unknown, r: string) => unknown;
        }
      ).nestedWhere(ctx, 'x'),
    ).toThrow(/check-only/);
  });

  // ---- uniform runtime guard: NO verb is special-cased ----------------------
  // A check-only role is legal in a grant whose `.check` path is used (update/
  // delete/scoped-RBAC), and fails ONLY when a `.where` form is actually
  // requested — regardless of which verb. No construction-time special-casing.

  it('check role in update/delete constructs AND its .check works', async () => {
    findMemberships.mockResolvedValue([{ role: 'ADMIN' }]);
    // buildTeamPolicy puts `teamAdmin` (r.check) in update/delete — legal, and
    // usable via .check. Construction never throws (no boot-walk).
    const policy = buildTeamPolicy();
    const ok = await policy.roles.teamAdmin.check(makeCtx(USER_ID), {
      id: 't',
    } as never);
    expect(ok).toBe(true);
  });

  it('check role in a `read` grant fails when read.where is invoked (uniform, not boot)', () => {
    // Construction is fine — no verb is special-cased. The uniform guard fires
    // when the where-form is actually requested (here `read.where`), same as
    // any other where path.
    const policy = createModelPolicy({
      model: 'blog',
      idField: 'id',
      delegate: prisma.blog,
      roles: (r) => ({ teamAdmin: r.check(() => Promise.resolve(true)) }),
      actions: { read: { roles: ['teamAdmin'] } },
    });
    expect(() => policy.read.where(makeCtx(USER_ID))).toThrow(/check-only/);
  });
});
