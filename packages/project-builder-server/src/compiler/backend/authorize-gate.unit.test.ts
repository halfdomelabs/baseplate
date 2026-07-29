import { describe, expect, it } from 'vitest';

import type { InstanceRoleFloor } from './authorize-gate.js';

import {
  deriveInstanceRoleFloor,
  resolveCoarseAuthorizeRoles,
} from './authorize-gate.js';

// `system` is excluded from both: it is only ever assigned to background jobs,
// which never reach a GraphQL resolver.
const ANONYMOUS_ROLES = ['public', 'user', 'admin'];
// `public` is auto-assigned to unauthenticated callers, so it is excluded too.
const AUTHENTICATED_ROLES = ['user', 'admin'];

// Global roles arrive as id refs and are resolved to names; instance roles are
// resolved to a floor by parsing the model's authorizer expression.
const baseResolvers = {
  globalRoleName: (roleRef: string) => roleRef.replace('role:', ''),
  instanceRoleFloor: (): InstanceRoleFloor | undefined => ({
    kind: 'authenticated',
  }),
  authenticatedRoleNames: () => AUTHENTICATED_ROLES,
  allAuthRoleNames: () => ANONYMOUS_ROLES,
};

function resolve(
  grant: { globalRoles?: string[]; instanceRoles?: string[] },
  overrides: Partial<typeof baseResolvers> = {},
): string[] | undefined {
  return resolveCoarseAuthorizeRoles(
    {
      globalRoles: grant.globalRoles ?? [],
      instanceRoles: grant.instanceRoles ?? [],
    },
    { ...baseResolvers, ...overrides },
  );
}

describe('resolveCoarseAuthorizeRoles', () => {
  it('emits no gate when neither global nor instance roles are set', () => {
    expect(resolve({})).toBeUndefined();
  });

  it('passes global roles through, resolved to names', () => {
    expect(resolve({ globalRoles: ['role:admin', 'role:user'] })).toEqual([
      'admin',
      'user',
    ]);
  });

  // The ENG-1228 regression: an instance-only grant used to emit no gate at
  // all, which fails the Pothos `requireOnRootFields` check at schema build.
  // `user` alone, since every authenticated caller holds it.
  it('gates a session-bound instance-only grant on `user`', () => {
    expect(resolve({ instanceRoles: ['recipient'] })).toEqual(['user']);
  });

  // `admin` is redundant next to `user`: `authorize` is an OR and every
  // authenticated caller — admins included — holds `user`.
  it('collapses a gate containing `user` down to `user`', () => {
    expect(
      resolve({ globalRoles: ['role:admin'], instanceRoles: ['owner'] }),
    ).toEqual(['user']);
  });

  it('keeps a global role when the floor does not reach `user`', () => {
    expect(
      resolve(
        { globalRoles: ['role:pro-user'], instanceRoles: ['member'] },
        { authenticatedRoleNames: () => ['admin'] },
      ),
    ).toEqual(['pro-user', 'admin']);
  });

  // `public` already admits everyone, so there is nothing to widen.
  it('collapses to `public` when a global role admits everyone', () => {
    expect(
      resolve({ globalRoles: ['role:public'], instanceRoles: ['member'] }),
    ).toEqual(['public']);
  });

  // e.g. `model.isPublic === true` — no `auth.*` reference, so any caller can
  // satisfy it and the gate must stay open to everyone.
  it('collapses to `public` when an instance role can match anonymously', () => {
    expect(
      resolve(
        { instanceRoles: ['publiclyVisible'] },
        { instanceRoleFloor: () => ({ kind: 'anonymous' }) },
      ),
    ).toEqual(['public']);
  });

  // e.g. `auth.hasRole('system')` — only that global role can satisfy it.
  it('gates on the floor global roles for a role-check instance role', () => {
    expect(
      resolve(
        { instanceRoles: ['systemOnly'] },
        {
          instanceRoleFloor: () => ({
            kind: 'globalRoles',
            roles: ['system'],
          }),
        },
      ),
    ).toEqual(['system']);
  });

  // An unresolvable expression could be satisfied by anyone, so stay open
  // rather than silently locking callers out.
  it('falls back to the widest gate when an instance role cannot be resolved', () => {
    expect(
      resolve(
        { instanceRoles: ['unknown'] },
        { instanceRoleFloor: () => undefined },
      ),
    ).toEqual(['public']);
  });

  it('deduplicates roles contributed by both globals and the floor', () => {
    expect(
      resolve(
        { globalRoles: ['role:pro-user'], instanceRoles: ['owner'] },
        { authenticatedRoleNames: () => ['pro-user', 'admin'] },
      ),
    ).toEqual(['pro-user', 'admin']);
  });

  it('emits no gate for an instance-only grant when no auth roles exist', () => {
    expect(
      resolve(
        { instanceRoles: ['owner'] },
        { authenticatedRoleNames: () => [], allAuthRoleNames: () => [] },
      ),
    ).toBeUndefined();
  });
});

describe('deriveInstanceRoleFloor', () => {
  // Expressions below are taken verbatim from the example projects.
  it.each([
    ['model.ownerId === userId', 'authenticated'],
    ['model.id === userId', 'authenticated'],
    ['exists(model.members, { userId: userId })', 'authenticated'],
    ["hasRole(model.members, 'owner')", 'authenticated'],
  ])('treats %s as authenticated-only', (expression, kind) => {
    expect(deriveInstanceRoleFloor(expression)).toEqual({ kind });
  });

  // No `auth` reference on either side, so any caller can satisfy it.
  it('treats a literal-only comparison as anonymous', () => {
    expect(deriveInstanceRoleFloor('model.isPublic === true')).toEqual({
      kind: 'anonymous',
    });
  });

  it('reduces a bare role check to that global role', () => {
    expect(deriveInstanceRoleFloor("hasRole('system')")).toEqual({
      kind: 'globalRoles',
      roles: ['system'],
    });
  });

  // `||` takes the weaker side — either branch alone can grant.
  it('takes the weaker side of an OR', () => {
    expect(
      deriveInstanceRoleFloor(
        'hasRole(model.todoList, "owner") || hasRole(\'admin\')',
      ),
    ).toEqual({ kind: 'authenticated' });
  });

  it('opens an OR up to anonymous when either side matches anonymously', () => {
    expect(
      deriveInstanceRoleFloor('model.isPublic === true || model.id === userId'),
    ).toEqual({ kind: 'anonymous' });
  });

  // `&&` takes the stronger side — both must hold.
  it('takes the stronger side of an AND', () => {
    expect(
      deriveInstanceRoleFloor('model.isPublic === true && model.id === userId'),
    ).toEqual({ kind: 'authenticated' });
  });

  it('prefers a role requirement over a session requirement in an AND', () => {
    expect(
      deriveInstanceRoleFloor("model.id === userId && hasRole('admin')"),
    ).toEqual({ kind: 'globalRoles', roles: ['admin'] });
  });
});
