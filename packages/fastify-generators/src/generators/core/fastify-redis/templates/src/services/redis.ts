// @ts-nocheck

import { config } from '%configServiceImports';
import { Redis } from 'ioredis';

export function createRedisClient({
  usePrefix = true,
}: { usePrefix?: boolean } = {}): Redis {
  return new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    keyPrefix: usePrefix ? config.REDIS_KEY_PREFIX : undefined,
  });
}

let cachedRedisClient: Redis | null = null;

export function getRedisClient(): Redis {
  cachedRedisClient ??= createRedisClient();
  return cachedRedisClient;
}
