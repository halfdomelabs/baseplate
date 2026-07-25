import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { CORE_FASTIFY_REDIS_PATHS } from './template-paths.js';

export const fastifyRedisImportsSchema = createTsImportMapSchema({
  createRedisRuntime: {},
  RedisRuntime: { isTypeOnly: true },
});

export type FastifyRedisImportsProvider = TsImportMapProviderFromSchema<
  typeof fastifyRedisImportsSchema
>;

export const fastifyRedisImportsProvider =
  createReadOnlyProviderType<FastifyRedisImportsProvider>(
    'fastify-redis-imports',
  );

const coreFastifyRedisImportsTask = createGeneratorTask({
  dependencies: {
    paths: CORE_FASTIFY_REDIS_PATHS.provider,
  },
  exports: {
    fastifyRedisImports: fastifyRedisImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        fastifyRedisImports: createTsImportMap(fastifyRedisImportsSchema, {
          createRedisRuntime: paths.redis,
          RedisRuntime: paths.redis,
        }),
      },
    };
  },
});

export const CORE_FASTIFY_REDIS_IMPORTS = {
  task: coreFastifyRedisImportsTask,
};
