import { afterEach, expect, it, vi } from 'vitest';

import { createAppRuntime } from './app-runtime.js';

/**
 * Construction-invariant acceptance test: `createAppRuntime()` must not
 * connect or perform I/O. Every env var below points at an unreachable or
 * obviously-fake endpoint; construction and disposal must still succeed,
 * proving every constructed client (ioredis, pubsub) is passive/lazy-connect
 * rather than eager.
 *
 * Stubbed inside `vi.hoisted`, which runs before the import above: modules on
 * that graph read config at import time.
 */
vi.hoisted(() => {
  const disconnectedEnv: Record<string, string> = {
    API_URL: 'http://localhost:1',
    APP_ENVIRONMENT: 'test',
    // Any 32+ character value from the allowed set; nothing here signs or
    // verifies anything, it only has to satisfy the config validator.
    APP_SECRET: 'a'.repeat(32),
    DATABASE_URL: 'postgresql://user:pass@localhost:1/db',
    EMAIL_DEFAULT_FROM: 'noreply@example.com',
    POSTMARK_SERVER_TOKEN: 'test-postmark-token',
    REDIS_KEY_PREFIX: 'test:',
    // Port 1 is a privileged, unlisted port - connecting to it fails fast
    // without any external infrastructure being reachable.
    REDIS_URL: 'redis://localhost:1',
    SERVER_HOST: 'localhost',
    SERVER_PORT: '1',
    WEB_URL_ADMIN: 'http://localhost:1',
    WEB_URL_APP: 'http://localhost:1',
  };

  for (const [key, value] of Object.entries(disconnectedEnv)) {
    vi.stubEnv(key, value);
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
});

it('constructs and disposes without external infrastructure', async () => {
  const runtime = createAppRuntime();
  await expect(runtime.dispose()).resolves.toBeUndefined();
});
