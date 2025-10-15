import './sentry.instrument.test-helper';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as configModule from '@src/services/config.js';

import { buildServer } from '@src/server.js';
import { BadRequestError } from '@src/utils/http-errors.js';

import { logErrorToSentry } from './sentry.js';
import { getSentryTestkit } from './sentry.test-kit.test-helper.js';

vi.mock('@src/services/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@src/services/config', async (importOriginal) => {
  const actual = await importOriginal<typeof configModule>();
  return {
    ...actual,
    config: {
      ...actual.config,
      SENTRY_DSN: 'mock-dsn',
    },
  };
});

const { testkit } = getSentryTestkit();

beforeEach(() => {
  testkit.reset();
});

it('should handle fastify request errors', async () => {
  const server = await buildServer({
    logger: false,
  });

  try {
    // build server calls registerSentryEventProcessor

    // add dummy error endpoint
    server.get('/error', () => {
      throw new Error('test error');
    });

    // this should not be logged since it's a 400
    server.get('/bad-request', () => {
      throw new BadRequestError('bad request');
    });

    // we need to simulate a real request to get the correct contexts for Sentry
    const RANDOM_PORT = Math.floor(Math.random() * 10_000) + 9000;
    await server.listen({ port: RANDOM_PORT });

    await fetch(`http://localhost:${RANDOM_PORT}/error`, {
      method: 'GET',
      headers: {
        cookie: 'test=test',
        authorization: '',
        'user-agent': 'test-user-agent',
      },
    });

    await fetch(`http://localhost:${RANDOM_PORT}/bad-request`, {
      method: 'GET',
    });

    await vi.waitUntil(() => testkit.reports().length === 1, {
      timeout: 500,
    });

    const report = testkit.reports()[0];

    expect(report.level).toBe('error');
    expect(report.error?.message).toBe('test error');
    expect(report.originalReport.transaction).toBe('GET /error');
    // make sure we don't log the cookie or authorization header
    const headerKeys = Object.keys(
      report.originalReport.request?.headers ?? {},
    );
    expect(headerKeys).not.toContain('cookie');
    expect(headerKeys).not.toContain('authorization');
    expect(headerKeys).toContain('user-agent');
  } finally {
    await server.close();
  }
});

describe('logErrorToSentry', () => {
  it('should log an error to Sentry', async () => {
    const error = new Error('test error');
    logErrorToSentry(error);

    await vi.waitUntil(() => testkit.reports().length === 1, {
      timeout: 500,
    });

    expect(testkit.reports()).toHaveLength(1);
    const report = testkit.reports()[0];
    expect(report.level).toBe('error');
    expect(report.error?.message).toBe('test error');
  });
});
