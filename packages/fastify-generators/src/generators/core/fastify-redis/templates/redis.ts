// @ts-nocheck
import Redis from 'ioredis';

export function createRedisClient(): Redis {
  return new Redis(CONFIG.REDIS_URL, {
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
