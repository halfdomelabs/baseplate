import type { FastifyInstance } from 'fastify';

import Fastify from 'fastify';
import { beforeEach, describe, expect, it } from 'vitest';

import type { AuthRole } from '@src/modules/accounts/auth/constants/auth-roles.constants.js';

import { createAuthContextFromSessionInfo } from '@src/modules/accounts/auth/utils/auth-context.utils.js';
import { graphqlPlugin } from '@src/plugins/graphql/index.js';
import { prisma } from '@src/services/prisma.js';
import { createTestServiceContext } from '@src/tests/helpers/service-context.test-helper.js';

async function buildApp(
  roles: AuthRole[],
  userId?: string,
): Promise<FastifyInstance> {
  const fastify = Fastify();
  fastify.decorateRequest('serviceContext');
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.serviceContext = {
      ...createTestServiceContext({
        auth: createAuthContextFromSessionInfo(
          userId === undefined
            ? undefined
            : { type: 'user', id: 'test-session', userId, roles },
        ),
      }),
      cookieStore: {
        get: () => undefined,
        set: () => undefined,
        clear: () => undefined,
      },
      reqInfo: {
        id: 'test',
        url: '/graphql',
        method: 'POST',
        headers: {},
        ip: '127.0.0.1',
      },
    };
    done();
  });
  await fastify.register(graphqlPlugin);
  return fastify;
}

async function queryGraphql(
  fastify: FastifyInstance,
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data?: Record<string, unknown>; errors?: { message: string }[] }> {
  const response = await fastify.inject({
    method: 'POST',
    url: '/graphql',
    payload: { query, variables },
  });
  return JSON.parse(response.body) as {
    data?: Record<string, unknown>;
    errors?: { message: string }[];
  };
}

beforeEach(async () => {
  await prisma.todoListShare.deleteMany({});
  await prisma.todoList.deleteMany({});
  await prisma.user.deleteMany({});
});

describe('todoLists where filtering', () => {
  it('filters by a scalar field with a contains operator', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner-scalar@example.com' },
    });
    await prisma.todoList.createMany({
      data: [
        { ownerId: owner.id, position: 0, name: 'Groceries' },
        { ownerId: owner.id, position: 1, name: 'Work tasks' },
        { ownerId: owner.id, position: 2, name: 'Grocery run' },
      ],
    });

    const fastify = await buildApp(['public', 'user', 'admin'], owner.id);

    const result = await queryGraphql(
      fastify,
      `query ($where: TodoListWhereInput) {
        todoLists(where: $where) { name }
      }`,
      { where: { name: { contains: 'Grocer' } } },
    );

    expect(result.errors).toBeUndefined();
    const lists = result.data?.todoLists as { name: string }[];
    expect(lists.map((l) => l.name).toSorted()).toEqual(
      ['Groceries', 'Grocery run'].toSorted(),
    );

    await fastify.close();
  });

  it('filters by enum equality', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner-enum@example.com' },
    });
    await prisma.todoList.createMany({
      data: [
        {
          ownerId: owner.id,
          position: 0,
          name: 'Active list',
          status: 'ACTIVE',
        },
        {
          ownerId: owner.id,
          position: 1,
          name: 'Inactive list',
          status: 'INACTIVE',
        },
      ],
    });

    const fastify = await buildApp(['public', 'user', 'admin'], owner.id);

    const result = await queryGraphql(
      fastify,
      `query ($where: TodoListWhereInput) {
        todoLists(where: $where) { name status }
      }`,
      { where: { status: { equals: 'ACTIVE' } } },
    );

    expect(result.errors).toBeUndefined();
    const lists = result.data?.todoLists as { name: string; status: string }[];
    expect(lists).toHaveLength(1);
    expect(lists[0]?.name).toBe('Active list');

    await fastify.close();
  });

  it('composes filters with AND/OR', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner-composite@example.com' },
    });
    await prisma.todoList.createMany({
      data: [
        {
          ownerId: owner.id,
          position: 0,
          name: 'Alpha active',
          status: 'ACTIVE',
        },
        {
          ownerId: owner.id,
          position: 1,
          name: 'Beta active',
          status: 'ACTIVE',
        },
        {
          ownerId: owner.id,
          position: 2,
          name: 'Alpha inactive',
          status: 'INACTIVE',
        },
      ],
    });

    const fastify = await buildApp(['public', 'user', 'admin'], owner.id);

    const result = await queryGraphql(
      fastify,
      `query ($where: TodoListWhereInput) {
        todoLists(where: $where) { name status }
      }`,
      {
        where: {
          OR: [
            {
              AND: [
                { name: { contains: 'Alpha' } },
                { status: { equals: 'ACTIVE' } },
              ],
            },
            { name: { equals: 'Beta active' } },
          ],
        },
      },
    );

    expect(result.errors).toBeUndefined();
    const lists = result.data?.todoLists as { name: string; status: string }[];
    expect(lists.map((l) => l.name).toSorted()).toEqual(
      ['Alpha active', 'Beta active'].toSorted(),
    );

    await fastify.close();
  });

  it('rejects a where filter nested deeper than the configured max depth', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner-depth@example.com' },
    });
    await prisma.todoList.create({
      data: { ownerId: owner.id, position: 0, name: 'Solo' },
    });

    const fastify = await buildApp(['public', 'user', 'admin'], owner.id);

    // The configured max depth is 4; nest AND five levels deep to exceed it.
    let where: Record<string, unknown> = { name: { equals: 'Solo' } };
    for (let i = 0; i < 5; i++) {
      where = { AND: [where] };
    }

    const result = await queryGraphql(
      fastify,
      `query ($where: TodoListWhereInput) {
        todoLists(where: $where) { name }
      }`,
      { where },
    );

    // Validation errors are masked to a generic message by the yoga error
    // masking config (only HttpError subclasses pass through unmasked), so
    // this only asserts the query is rejected, not the message content.
    expect(result.errors).toBeDefined();
    expect(result.data?.todoLists).toBeUndefined();

    await fastify.close();
  });

  it('rejects a where filter with more clauses than the configured max, even when shallow', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner-breadth@example.com' },
    });
    await prisma.todoList.create({
      data: { ownerId: owner.id, position: 0, name: 'Solo' },
    });

    const fastify = await buildApp(['public', 'user', 'admin'], owner.id);

    // Depth 2 (well under the depth limit), but 30 OR clauses exceeds the
    // configured max clause count of 25 — proves breadth is bounded
    // independently of depth.
    const where = {
      OR: Array.from({ length: 30 }, (_, i) => ({
        name: { equals: `item-${i}` },
      })),
    };

    const result = await queryGraphql(
      fastify,
      `query ($where: TodoListWhereInput) {
        todoLists(where: $where) { name }
      }`,
      { where },
    );

    expect(result.errors).toBeDefined();
    expect(result.data?.todoLists).toBeUndefined();

    await fastify.close();
  });

  it('rejects a scalar filter whose in/notIn array exceeds the configured max, even at depth 1', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner-in-array@example.com' },
    });
    await prisma.todoList.create({
      data: { ownerId: owner.id, position: 0, name: 'Solo' },
    });

    const fastify = await buildApp(['public', 'user', 'admin'], owner.id);

    // Depth 1, a single clause — passes the AND/OR/NOT clause-count check —
    // but the `in` array itself has 30 entries, exceeding the configured
    // max clause count of 25.
    const where = {
      name: { in: Array.from({ length: 30 }, (_, i) => `item-${i}`) },
    };

    const result = await queryGraphql(
      fastify,
      `query ($where: TodoListWhereInput) {
        todoLists(where: $where) { name }
      }`,
      { where },
    );

    expect(result.errors).toBeDefined();
    expect(result.data?.todoLists).toBeUndefined();

    await fastify.close();
  });

  it('composes the caller-supplied where with the read policy filter rather than replacing it', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner-composed@example.com' },
    });
    await prisma.todoList.createMany({
      data: [
        { ownerId: owner.id, position: 0, name: 'Keep me', status: 'ACTIVE' },
        {
          ownerId: owner.id,
          position: 1,
          name: 'Filtered out',
          status: 'INACTIVE',
        },
      ],
    });

    const fastify = await buildApp(['public', 'user', 'admin'], owner.id);

    // A wide-open OR clause still only returns rows matching BOTH the
    // caller's where AND whatever the policy's read.where contributes (here,
    // admin's grant is unrestricted, so this mainly proves `where` isn't
    // silently dropped or OR'd against the auth filter).
    const result = await queryGraphql(
      fastify,
      `query ($where: TodoListWhereInput) {
        todoLists(where: $where) { name }
      }`,
      { where: { status: { equals: 'ACTIVE' } } },
    );

    expect(result.errors).toBeUndefined();
    const lists = result.data?.todoLists as { name: string }[];
    expect(lists.map((l) => l.name)).toEqual(['Keep me']);

    await fastify.close();
  });
});
