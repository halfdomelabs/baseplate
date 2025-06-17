import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';

const mockRedis = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'mock-redis',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/scripts/mock-redis.ts',
    ),
  },
  variables: {},
});

const redis = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'redis',
  projectExports: { createRedisClient: {}, getRedisClient: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/redis.ts'),
  },
  variables: {},
});

export const CORE_FASTIFY_REDIS_TEMPLATES = { redis, mockRedis };
