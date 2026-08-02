import { Redis } from 'ioredis';

import { getConfig } from './config.js';

/**
 * Connection manager for Redis. Construction allocates no connections;
 * connections are created lazily (`lazyConnect: true`) and only actually
 * connect on first command, so `createRedisRuntime()` performs no I/O.
 */
export interface RedisRuntime {
  /**
   * Creates a tracked, lazily-connecting Redis connection.
   *
   * @param options - Connection options
   * @param options.usePrefix - Whether to apply `REDIS_KEY_PREFIX` to keys on this connection (default true)
   * @returns A new `ioredis` client that has not yet connected
   */
  createConnection(options?: { usePrefix?: boolean }): Redis;
  /** Explicit health check. Connects (if needed) and pings Redis. */
  healthCheck(): Promise<void>;
  /** Closes every connection created via `createConnection`. No-op if none ever connected. */
  dispose(): Promise<void>;
}

/**
 * Creates a {@link RedisRuntime}. Performs no I/O - connections are only
 * opened lazily on first command or explicit {@link RedisRuntime.healthCheck}.
 *
 * @returns The redis connection manager
 */
export function createRedisRuntime(): RedisRuntime {
  const connections: Redis[] = [];

  function createConnection({
    usePrefix = true,
  }: { usePrefix?: boolean } = {}): Redis {
    const { REDIS_URL, REDIS_KEY_PREFIX } = getConfig();
    const client = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      keyPrefix: usePrefix ? REDIS_KEY_PREFIX : undefined,
    });
    connections.push(client);
    return client;
  }

  let healthCheckClient: Redis | undefined;

  return {
    createConnection,
    async healthCheck(): Promise<void> {
      healthCheckClient ??= createConnection();
      await healthCheckClient.ping();
    },
    async dispose(): Promise<void> {
      await Promise.all(connections.map((client) => client.quit()));
    },
  };
}
