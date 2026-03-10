import { beforeEach, describe, expect, it } from 'vitest';

import { createAuthContextFromSessionInfo } from '@src/modules/accounts/auth/utils/auth-context.utils.js';
import { prisma } from '@src/services/prisma.js';
import { createTestServiceContext } from '@src/tests/helpers/service-context.test-helper.js';

import { todoItemQueryFilter } from './todo-item.query-filter.js';

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

let ownerUserId = '';
let otherUserId = '';
let ownerTodoItemId = '';
let otherTodoItemId = '';

beforeEach(async () => {
  await prisma.user.deleteMany({});

  const owner = await prisma.user.create({
    data: { name: 'Owner', email: 'owner@test.com' },
  });
  const other = await prisma.user.create({
    data: { name: 'Other', email: 'other@test.com' },
  });

  ownerUserId = owner.id;
  otherUserId = other.id;

  const ownerList = await prisma.todoList.create({
    data: { ownerId: owner.id, position: 1, name: 'Owner List' },
  });
  const otherList = await prisma.todoList.create({
    data: { ownerId: other.id, position: 1, name: 'Other List' },
  });

  const ownerItem = await prisma.todoItem.create({
    data: {
      todoListId: ownerList.id,
      position: 1,
      text: 'Owner Item',
      done: false,
    },
  });
  const otherItem = await prisma.todoItem.create({
    data: {
      todoListId: otherList.id,
      position: 1,
      text: 'Other Item',
      done: false,
    },
  });

  ownerTodoItemId = ownerItem.id;
  otherTodoItemId = otherItem.id;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createCtx(
  userId: string,
): ReturnType<typeof createTestServiceContext> {
  return createTestServiceContext({
    auth: createAuthContextFromSessionInfo({
      id: 'sess-1',
      type: 'user',
      userId,
      roles: ['public', 'user'],
    }),
  });
}

function createAdminCtx(
  userId: string,
): ReturnType<typeof createTestServiceContext> {
  return createTestServiceContext({
    auth: createAuthContextFromSessionInfo({
      id: 'sess-1',
      type: 'user',
      userId,
      roles: ['public', 'user', 'admin'],
    }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('todoItemQueryFilter integration', () => {
  describe('buildWhere with findMany', () => {
    it('should only return todo items owned by the user (via todoList ownership)', async () => {
      const ctx = createCtx(ownerUserId);
      const where = todoItemQueryFilter.buildWhere(ctx, ['owner']);

      const items = await prisma.todoItem.findMany({ where });
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(ownerTodoItemId);
    });

    it('should return different items for a different user', async () => {
      const ctx = createCtx(otherUserId);
      const where = todoItemQueryFilter.buildWhere(ctx, ['owner']);

      const items = await prisma.todoItem.findMany({ where });
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(otherTodoItemId);
    });

    it('should return no filter for admin (unrestricted access)', async () => {
      const ctx = createAdminCtx(ownerUserId);
      const where = todoItemQueryFilter.buildWhere(ctx, ['owner']);

      // Admin gets undefined (no filter), meaning all items returned
      expect(where).toBeUndefined();

      const items = await prisma.todoItem.findMany({ where });
      expect(items).toHaveLength(2);
    });
  });

  describe('buildWhere with findUniqueOrThrow', () => {
    it('should find own item', async () => {
      const ctx = createCtx(ownerUserId);
      const where = todoItemQueryFilter.buildWhere(ctx, ['owner']);

      const item = await prisma.todoItem.findUniqueOrThrow({
        where: {
          id: ownerTodoItemId,
          ...(where != null ? { AND: [where] } : {}),
        },
      });
      expect(item.id).toBe(ownerTodoItemId);
    });

    it("should reject access to another user's item", async () => {
      const ctx = createCtx(ownerUserId);
      const where = todoItemQueryFilter.buildWhere(ctx, ['owner']);

      await expect(
        prisma.todoItem.findUniqueOrThrow({
          where: {
            id: otherTodoItemId,
            ...(where != null ? { AND: [where] } : {}),
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('unauthenticated user', () => {
    it('should throw ForbiddenError when user has no userId', () => {
      const ctx = createTestServiceContext();
      // When unauthenticated, the null guard returns false for the owner role,
      // buildNestedWhere returns false, queryHelpers.or resolves to false,
      // and buildWhere throws ForbiddenError since all roles deny access
      expect(() => todoItemQueryFilter.buildWhere(ctx, ['owner'])).toThrow(
        'Forbidden',
      );
    });
  });
});
