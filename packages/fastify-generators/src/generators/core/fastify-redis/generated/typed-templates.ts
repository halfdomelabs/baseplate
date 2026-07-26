import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';

const redis = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'redis',
  projectExports: {
    createRedisRuntime: {},
    RedisRuntime: { isTypeOnly: true },
  },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/redis.ts'),
  },
  variables: {},
});

const setupRedis = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'setup-redis',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/scripts/setup-redis.ts',
    ),
  },
  variables: {},
});

export const CORE_FASTIFY_REDIS_TEMPLATES = { redis, setupRedis };
