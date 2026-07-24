import { afterEach, beforeEach, expect, it, vi } from 'vitest';

/**
 * Construction-invariant acceptance test: `createAppRuntime()` must not
 * connect or perform I/O. Every env var below points at an unreachable or
 * obviously-fake endpoint; construction and disposal must still succeed,
 * proving every constructed client (ioredis, pubsub) is passive/lazy-connect
 * rather than eager.
 */
const DISCONNECTED_TEST_ENV: Record<string, string> = {
  ALLOWED_ORIGINS: '',
  APP_ENVIRONMENT: 'test',
  AUTH_FRONTEND_URL: 'http://localhost:1',
  AUTH_SECRET: 'a'.repeat(20),
  DATABASE_URL: 'postgresql://user:pass@localhost:1/db',
  EMAIL_DEFAULT_FROM: 'noreply@example.com',
  POSTMARK_SERVER_TOKEN: 'test-postmark-token',
  REDIS_KEY_PREFIX: 'test:',
  // Port 1 is a privileged, unlisted port - connecting to it fails fast
  // without any external infrastructure being reachable.
  REDIS_URL: 'redis://localhost:1',
  SERVER_HOST: 'localhost',
  SERVER_PORT: '1',
};

beforeEach(() => {
  vi.resetModules();
  for (const [key, value] of Object.entries(DISCONNECTED_TEST_ENV)) {
    vi.stubEnv(key, value);
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
});

it('constructs and disposes without external infrastructure', async () => {
  const { createAppRuntime } = await import('./app-runtime.js');

  const runtime = createAppRuntime();
  await expect(runtime.dispose()).resolves.toBeUndefined();
});
