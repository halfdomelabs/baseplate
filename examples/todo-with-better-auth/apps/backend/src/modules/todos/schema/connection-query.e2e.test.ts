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

describe('todoListsConnection', () => {
  it('paginates with a cursor and reports totalCount for a single-column primary key', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner@example.com' },
    });

    const lists = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        prisma.todoList.create({
          data: { ownerId: owner.id, position: i, name: `List ${i}` },
        }),
      ),
    );

    const fastify = await buildApp(['public', 'user', 'admin'], owner.id);

    const firstPage = await queryGraphql(
      fastify,
      `query ($first: Int, $after: String) {
        todoListsConnection(first: $first, after: $after) {
          totalCount
          pageInfo { hasNextPage endCursor }
          edges { cursor node { id name } }
        }
      }`,
      { first: 2 },
    );

    expect(firstPage.errors).toBeUndefined();
    const firstConnection = firstPage.data?.todoListsConnection as {
      totalCount: number;
      pageInfo: { hasNextPage: boolean; endCursor: string };
      edges: { cursor: string; node: { id: string; name: string } }[];
    };

    expect(firstConnection.totalCount).toBe(5);
    expect(firstConnection.edges).toHaveLength(2);
    expect(firstConnection.pageInfo.hasNextPage).toBe(true);

    const secondPage = await queryGraphql(
      fastify,
      `query ($first: Int, $after: String) {
        todoListsConnection(first: $first, after: $after) {
          pageInfo { hasNextPage endCursor }
          edges { node { id } }
        }
      }`,
      { first: 2, after: firstConnection.pageInfo.endCursor },
    );

    expect(secondPage.errors).toBeUndefined();
    const secondConnection = secondPage.data?.todoListsConnection as {
      pageInfo: { hasNextPage: boolean; endCursor: string };
      edges: { node: { id: string } }[];
    };
    expect(secondConnection.edges).toHaveLength(2);
    expect(secondConnection.pageInfo.hasNextPage).toBe(true);

    const thirdPage = await queryGraphql(
      fastify,
      `query ($first: Int, $after: String) {
        todoListsConnection(first: $first, after: $after) {
          pageInfo { hasNextPage }
          edges { node { id } }
        }
      }`,
      { first: 2, after: secondConnection.pageInfo.endCursor },
    );

    expect(thirdPage.errors).toBeUndefined();
    const thirdConnection = thirdPage.data?.todoListsConnection as {
      pageInfo: { hasNextPage: boolean };
      edges: { node: { id: string } }[];
    };
    expect(thirdConnection.edges).toHaveLength(1);
    expect(thirdConnection.pageInfo.hasNextPage).toBe(false);

    // Pages partition the full set with no overlap or gaps, regardless of order.
    const seenIds = [
      ...firstConnection.edges.map((e) => e.node.id),
      ...secondConnection.edges.map((e) => e.node.id),
      ...thirdConnection.edges.map((e) => e.node.id),
    ];
    expect(new Set(seenIds).size).toBe(5);
    expect(seenIds.toSorted()).toEqual(lists.map((l) => l.id).toSorted());

    await fastify.close();
  });

  it('rejects non-admin access', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner2@example.com' },
    });
    const fastify = await buildApp(['public', 'user'], owner.id);

    const result = await queryGraphql(
      fastify,
      `query { todoListsConnection(first: 1) { totalCount } }`,
    );

    expect(result.errors).toBeDefined();
    await fastify.close();
  });
});

describe('todoListSharesConnection', () => {
  it('paginates using the composite primary key as the cursor', async () => {
    const owner = await prisma.user.create({
      data: { name: 'Owner', email: 'owner3@example.com' },
    });
    const otherUsers = await Promise.all(
      Array.from({ length: 3 }, (_, i) =>
        prisma.user.create({
          data: { name: `Sharee ${i}`, email: `sharee${i}@example.com` },
        }),
      ),
    );
    const list = await prisma.todoList.create({
      data: { ownerId: owner.id, position: 0, name: 'Shared List' },
    });

    await Promise.all(
      otherUsers.map((u) =>
        prisma.todoListShare.create({
          data: { todoListId: list.id, userId: u.id },
        }),
      ),
    );

    const fastify = await buildApp(['public', 'user'], owner.id);

    const result = await queryGraphql(
      fastify,
      `query ($first: Int) {
        todoListSharesConnection(first: $first) {
          totalCount
          pageInfo { hasNextPage endCursor }
          edges { cursor node { todoListId userId } }
        }
      }`,
      { first: 2 },
    );

    expect(result.errors).toBeUndefined();
    const connection = result.data?.todoListSharesConnection as {
      totalCount: number;
      pageInfo: { hasNextPage: boolean; endCursor: string };
      edges: { cursor: string; node: { todoListId: string; userId: string } }[];
    };

    expect(connection.totalCount).toBe(3);
    expect(connection.edges).toHaveLength(2);
    expect(connection.pageInfo.hasNextPage).toBe(true);
    // cursor is opaque base64, but must decode to the compound key
    const decoded = Buffer.from(
      connection.edges[0]?.cursor ?? '',
      'base64',
    ).toString('utf8');
    expect(decoded).toContain(list.id);

    await fastify.close();
  });
});
