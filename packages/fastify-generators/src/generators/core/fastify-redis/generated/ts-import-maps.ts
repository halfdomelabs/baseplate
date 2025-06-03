import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const fastifyRedisImportsSchema = createTsImportMapSchema({
  createRedisClient: {},
  getRedisClient: {},
});

type FastifyRedisImportsProvider = TsImportMapProviderFromSchema<
  typeof fastifyRedisImportsSchema
>;

export const fastifyRedisImportsProvider =
  createReadOnlyProviderType<FastifyRedisImportsProvider>(
    'fastify-redis-imports',
  );

export function createFastifyRedisImports(
  importBase: string,
): FastifyRedisImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(fastifyRedisImportsSchema, {
    createRedisClient: path.join(importBase, 'redis.js'),
    getRedisClient: path.join(importBase, 'redis.js'),
  });
}
