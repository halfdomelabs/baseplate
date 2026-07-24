import type { FastifyInstance } from 'fastify';

import Fastify from 'fastify';
import { beforeEach, describe, expect, it } from 'vitest';

import type { AuthRole } from '@src/modules/accounts/auth/constants/auth-roles.constants.js';

import { createAuthContextFromSessionInfo } from '@src/modules/accounts/auth/utils/auth-context.utils.js';
import { graphqlPlugin } from '@src/plugins/graphql/index.js';
import { prisma } from '@src/services/prisma.js';
import { createServiceContext } from '@src/utils/service-context.js';

async function buildApp(
  roles: AuthRole[],
  userId?: string,
): Promise<FastifyInstance> {
  const fastify = Fastify();
  fastify.decorateRequest('serviceContext');
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.serviceContext = {
      ...createServiceContext(
        {
          auth: createAuthContextFromSessionInfo(
            userId === undefined
              ? undefined
              : { type: 'user', id: 'test-session', userId, roles },
          ),
        },
        {},
      ),
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

describe('User.todoLists', () => {
  it('returns all related records when no pagination args are given', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner@example.com' },
    });
    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        prisma.todoList.create({
          data: { ownerId: owner.id, position: i, name: `List ${i}` },
        }),
      ),
    );

    const fastify = await buildApp(['public', 'user'], owner.id);

    const result = await queryGraphql(
      fastify,
      `query ($id: Uuid!) {
        user(id: $id) {
          todoLists { id }
        }
      }`,
      { id: owner.id },
    );

    expect(result.errors).toBeUndefined();
    const user = result.data?.user as { todoLists: { id: string }[] };
    expect(user.todoLists).toHaveLength(5);

    await fastify.close();
  });

  it('applies skip and take to truncate and offset the result', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner2@example.com' },
    });
    // Assign explicit, lexically-sortable ids so ordering (by id) is
    // deterministic regardless of creation order or timing.
    const lists = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        prisma.todoList.create({
          data: {
            id: `00000000-0000-0000-0000-00000000000${i}`,
            ownerId: owner.id,
            position: i,
            name: `List ${i}`,
          },
        }),
      ),
    );

    const fastify = await buildApp(['public', 'user'], owner.id);

    const result = await queryGraphql(
      fastify,
      `query ($id: Uuid!, $skip: Int, $take: Int) {
        user(id: $id) {
          todoLists(skip: $skip, take: $take) { id }
        }
      }`,
      { id: owner.id, skip: 2, take: 2 },
    );

    expect(result.errors).toBeUndefined();
    const user = result.data?.user as { todoLists: { id: string }[] };
    expect(user.todoLists).toHaveLength(2);
    expect(user.todoLists.map((t) => t.id)).toEqual(
      lists.slice(2, 4).map((l) => l.id),
    );

    await fastify.close();
  });

  it('returns an empty array when skip exceeds the available count', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner3@example.com' },
    });
    await prisma.todoList.create({
      data: { ownerId: owner.id, position: 0, name: 'Only List' },
    });

    const fastify = await buildApp(['public', 'user'], owner.id);

    const result = await queryGraphql(
      fastify,
      `query ($id: Uuid!, $skip: Int) {
        user(id: $id) {
          todoLists(skip: $skip) { id }
        }
      }`,
      { id: owner.id, skip: 10 },
    );

    expect(result.errors).toBeUndefined();
    const user = result.data?.user as { todoLists: { id: string }[] };
    expect(user.todoLists).toHaveLength(0);

    await fastify.close();
  });
});
