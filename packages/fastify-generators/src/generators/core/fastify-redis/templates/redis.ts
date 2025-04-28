// @ts-nocheck

import { config } from '%configServiceImports';
import { Redis } from 'ioredis';

export function createRedisClient(): Redis {
  return new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}

let cachedRedisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (cachedRedisClient === null) {
    cachedRedisClient = createRedisClient();
  }
  return cachedRedisClient;
}
