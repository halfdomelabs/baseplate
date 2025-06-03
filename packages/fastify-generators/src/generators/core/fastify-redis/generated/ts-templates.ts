import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { configServiceImportsProvider } from '../../config-service/generated/ts-import-maps.js';

const mockRedis = createTsTemplateFile({
  name: 'mock-redis',
  projectExports: {},
  source: { path: 'mock-redis.ts' },
  variables: {},
});

const redis = createTsTemplateFile({
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'redis',
  projectExports: { createRedisClient: {}, getRedisClient: {} },
  source: { path: 'redis.ts' },
  variables: {},
});

export const CORE_FASTIFY_REDIS_TS_TEMPLATES = { mockRedis, redis };
