import { describe, expect, it } from 'vitest';

import type { AuthRole } from '@src/modules/accounts/auth/constants/auth-roles.constants.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { createAuthContextFromSessionInfo } from '@src/modules/accounts/auth/utils/auth-context.utils.js';
import { createServiceContext } from '@src/utils/service-context.js';

import { ForbiddenError } from './http-errors.js';
import { createModelQueryFilter } from './query-filters.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createCtx(
  userId: string | undefined,
  roles: AuthRole[] = [],
): ServiceContext {
  return createServiceContext({
    auth: createAuthContextFromSessionInfo(
      userId != null
        ? {
            id: 'sess-1',
            type: 'user',
            userId,
            roles: ['public', 'user', ...roles],
          }
        : undefined,
    ),
  });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const todoListQueryFilter = createModelQueryFilter({
  model: 'todoList',
  roles: {
    owner: (ctx) =>
      ctx.auth.hasRole('admin') ? true : { ownerId: ctx.auth.userId },
  },
});

const todoItemQueryFilter = createModelQueryFilter({
  model: 'todoItem',
  roles: {
    owner: (ctx) =>
      todoListQueryFilter.buildNestedWhere(ctx, 'todoList', ['owner']),
  },
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createModelQueryFilter', () => {
  describe('buildWhere', () => {
    it('should return OR clause for a where-returning role', () => {
      const ctx = createCtx('user-1');
      const result = todoListQueryFilter.buildWhere(ctx, ['owner']);
      expect(result).toEqual({ OR: [{ ownerId: 'user-1' }] });
    });

    it('should return undefined when a role returns true (unrestricted)', () => {
      const ctx = createCtx('user-1', ['admin']);
      const result = todoListQueryFilter.buildWhere(ctx, ['owner']);
      expect(result).toBeUndefined();
    });

    it('should throw ForbiddenError when all roles return false', () => {
      const allDenyFilter = createModelQueryFilter({
        model: 'todoList',
        roles: {
          nope: () => false,
        },
      });
      const ctx = createCtx('user-1');
      expect(() => allDenyFilter.buildWhere(ctx, ['nope'])).toThrow(
        ForbiddenError,
      );
    });

    it('should combine multiple roles with OR', () => {
      const multiRoleFilter = createModelQueryFilter({
        model: 'todoList',
        roles: {
          owner: (ctx) => ({ ownerId: ctx.auth.userId }),
          viewer: () => ({ name: { contains: 'shared' } }),
        },
      });
      const ctx = createCtx('user-1');
      const result = multiRoleFilter.buildWhere(ctx, ['owner', 'viewer']);
      expect(result).toEqual({
        OR: [{ ownerId: 'user-1' }, { name: { contains: 'shared' } }],
      });
    });

    it('should filter out false roles and still return remaining clauses', () => {
      const mixedFilter = createModelQueryFilter({
        model: 'todoList',
        roles: {
          deny: () => false,
          allow: (ctx) => ({ ownerId: ctx.auth.userId }),
        },
      });
      const ctx = createCtx('user-1');
      const result = mixedFilter.buildWhere(ctx, ['deny', 'allow']);
      expect(result).toEqual({ OR: [{ ownerId: 'user-1' }] });
    });
  });

  describe('buildNestedWhere', () => {
    it('should wrap where clause in relation field', () => {
      const ctx = createCtx('user-1');
      const result = todoListQueryFilter.buildNestedWhere(ctx, 'todoList', [
        'owner',
      ]);
      expect(result).toEqual({ todoList: { ownerId: 'user-1' } });
    });

    it('should return true when role grants unrestricted access', () => {
      const ctx = createCtx('user-1', ['admin']);
      const result = todoListQueryFilter.buildNestedWhere(ctx, 'todoList', [
        'owner',
      ]);
      expect(result).toBe(true);
    });

    it('should return false when all roles deny access', () => {
      const denyFilter = createModelQueryFilter({
        model: 'todoList',
        roles: {
          nope: () => false,
        },
      });
      const ctx = createCtx('user-1');
      const result = denyFilter.buildNestedWhere(ctx, 'todoList', ['nope']);
      expect(result).toBe(false);
    });

    it('should combine multiple roles with OR inside the relation field', () => {
      const multiRoleFilter = createModelQueryFilter({
        model: 'todoList',
        roles: {
          owner: (ctx) => ({ ownerId: ctx.auth.userId }),
          viewer: () => ({ name: { contains: 'shared' } }),
        },
      });
      const ctx = createCtx('user-1');
      const result = multiRoleFilter.buildNestedWhere(ctx, 'todoList', [
        'owner',
        'viewer',
      ]);
      expect(result).toEqual({
        todoList: {
          OR: [{ ownerId: 'user-1' }, { name: { contains: 'shared' } }],
        },
      });
    });
  });

  describe('nested query filter chain', () => {
    it('should produce nested where for child model', () => {
      const ctx = createCtx('user-1');
      const result = todoItemQueryFilter.buildWhere(ctx, ['owner']);
      expect(result).toEqual({
        OR: [{ todoList: { ownerId: 'user-1' } }],
      });
    });

    it('should return undefined when parent grants unrestricted access', () => {
      const ctx = createCtx('user-1', ['admin']);
      const result = todoItemQueryFilter.buildWhere(ctx, ['owner']);
      expect(result).toBeUndefined();
    });
  });
});
