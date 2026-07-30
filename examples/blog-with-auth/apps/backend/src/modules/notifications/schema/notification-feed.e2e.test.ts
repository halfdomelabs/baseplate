import type { FastifyInstance } from 'fastify';

import Fastify from 'fastify';
import { beforeEach, describe, expect, it } from 'vitest';

import { createAuthContextFromSessionInfo } from '@src/modules/accounts/auth/utils/auth-context.utils.js';
import { graphqlPlugin } from '@src/plugins/graphql/index.js';
import { prisma } from '@src/services/prisma.js';
import { createTestServiceContext } from '@src/tests/helpers/service-context.test-helper.js';

const FEED_QUERY = `query ($first: Int, $after: String) {
  notificationFeed(first: $first, after: $after) {
    totalCount
    pageInfo { hasNextPage endCursor }
    edges { node { id } }
  }
}`;

interface FeedConnection {
  totalCount: number;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  edges: { node: { id: string } }[];
}

async function buildApp(userId: string): Promise<FastifyInstance> {
  const fastify = Fastify();
  fastify.decorateRequest('serviceContext');
  fastify.addHook('preHandler', (req, _reply, done) => {
    req.serviceContext = {
      ...createTestServiceContext({
        auth: createAuthContextFromSessionInfo({
          type: 'user',
          id: 'test-session',
          userId,
          roles: ['public', 'user'],
        }),
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

/** Fetch one page of the feed, asserting the request itself succeeded. */
async function fetchFeed(
  fastify: FastifyInstance,
  variables: { first?: number; after?: string | null },
): Promise<FeedConnection> {
  const response = await fastify.inject({
    method: 'POST',
    url: '/graphql',
    payload: { query: FEED_QUERY, variables },
  });
  const body = JSON.parse(response.body) as {
    data?: { notificationFeed: FeedConnection };
    errors?: { message: string }[];
  };
  expect(body.errors).toBeUndefined();
  if (!body.data) throw new Error('no data returned');
  return body.data.notificationFeed;
}

async function createNotification(recipientId: string): Promise<string> {
  const row = await prisma.notification.create({
    data: {
      type: 'generic',
      templateVersion: 1,
      recipientId,
      params: { text: 'hi' },
      segments: [{ type: 'text', value: 'hi' }],
      fallbackText: 'hi',
    },
    select: { id: true },
  });
  return row.id;
}

describe('notificationFeed', () => {
  let userId: string;
  let fastify: FastifyInstance;

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
    const user = await prisma.user.create({
      data: { email: 'feed@example.com' },
      select: { id: true },
    });
    userId = user.id;
    fastify = await buildApp(userId);
  });

  it('pages with a cursor without skipping or repeating rows', async () => {
    for (let i = 0; i < 5; i++) await createNotification(userId);

    const first = await fetchFeed(fastify, { first: 2 });
    expect(first.totalCount).toBe(5);
    expect(first.pageInfo.hasNextPage).toBe(true);

    // A notification arrives mid-page: with offset paging this shifts every
    // row and page 2 re-serves a row from page 1.
    await createNotification(userId);

    const second = await fetchFeed(fastify, {
      first: 2,
      after: first.pageInfo.endCursor,
    });

    const seen = [...first.edges, ...second.edges].map((e) => e.node.id);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('walks the whole feed exactly once', async () => {
    const created = new Set<string>();
    for (let i = 0; i < 5; i++) created.add(await createNotification(userId));

    const walked: string[] = [];
    let after: string | null = null;
    for (;;) {
      const page = await fetchFeed(fastify, { first: 2, after });
      walked.push(...page.edges.map((e) => e.node.id));
      if (!page.pageInfo.hasNextPage) break;
      after = page.pageInfo.endCursor;
    }

    expect(new Set(walked)).toEqual(created);
  });

  it('serves only the caller’s own notifications', async () => {
    const other = await prisma.user.create({
      data: { email: 'other@example.com' },
      select: { id: true },
    });
    await createNotification(other.id);
    const mine = await createNotification(userId);

    const feed = await fetchFeed(fastify, { first: 10 });

    expect(feed.totalCount).toBe(1);
    expect(feed.edges.map((e) => e.node.id)).toEqual([mine]);
  });
});
