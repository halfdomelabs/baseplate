import { Redis } from 'ioredis';

import { config } from './config.js';

export function createRedisClient(): Redis {
  return new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

let cachedRedisClient: Redis | null = null;

export function getRedisClient(): Redis {
  cachedRedisClient ??= createRedisClient();
  return cachedRedisClient;
}
