import './sentry.instrument.test-helper.js';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as configModule from '@src/services/config.js';

import { buildServer } from '@src/server.js';
import { BadRequestError } from '@src/utils/http-errors.js';

import { logErrorToSentry } from './sentry.js';
import { sentryTestCollector } from './sentry.test-collector.test-helper.js';

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

beforeEach(() => {
  sentryTestCollector.reset();
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

    await vi.waitUntil(() => sentryTestCollector.reports().length === 1, {
      timeout: 500,
    });

    const report = sentryTestCollector.reports()[0];

    expect(report.event.level).toBe('error');
    expect(report.event.exception?.values?.[0]?.value).toBe('test error');
    expect(report.event.transaction).toBe('GET /error');
    // make sure we don't log the cookie or authorization header
    const headerKeys = Object.keys(report.event.request?.headers ?? {});
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

    await vi.waitUntil(() => sentryTestCollector.reports().length === 1, {
      timeout: 500,
    });

    expect(sentryTestCollector.reports()).toHaveLength(1);
    const report = sentryTestCollector.reports()[0];
    expect(report.event.level).toBe('error');
    expect(report.event.exception?.values?.[0]?.value).toBe('test error');
  });
});
