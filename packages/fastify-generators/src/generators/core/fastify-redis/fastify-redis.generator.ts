import type { ImportMap, ImportMapper } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  projectScope,
  tsCodeFragment,
  TypescriptCodeUtils,
  typescriptProvider,
  vitestProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

import { configServiceProvider } from '../config-service/config-service.generator.js';
import { fastifyHealthCheckProvider } from '../fastify-health-check/fastify-health-check.generator.js';

const descriptorSchema = z.object({
  defaultUrl: z.string().min(1),
});

export type FastifyRedisProvider = ImportMapper;

export const fastifyRedisProvider = createProviderType<FastifyRedisProvider>(
  'fastify-redis',
  { isReadOnly: true },
);

export const fastifyRedisGenerator = createGenerator({
  name: 'core/fastify-redis',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ defaultUrl }) => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['ioredis']),
      dev: extractPackageVersions(FASTIFY_PACKAGES, ['ioredis-mock']),
    }),
    main: createGeneratorTask({
      dependencies: {
        configService: configServiceProvider,
        fastifyHealthCheck: fastifyHealthCheckProvider,
        typescript: typescriptProvider,
        vitest: vitestProvider.dependency().optional(),
      },
      exports: {
        fastifyRedis: fastifyRedisProvider.export(projectScope),
      },
      run({ configService, fastifyHealthCheck, typescript, vitest }) {
        const [redisImport, redisPath] = makeImportAndFilePath(
          `src/services/redis.ts`,
        );

        const importMap: ImportMap = {
          '%fastify-redis': {
            path: redisImport,
            allowedImports: ['getRedisClient', 'createRedisClient'],
          },
        };

        configService.configFields.set('REDIS_URL', {
          validator: tsCodeFragment('z.string().min(1)'),
          comment: 'Connection URL of Redis',
          exampleValue: defaultUrl,
        });
        fastifyHealthCheck.addCheck(
          TypescriptCodeUtils.createBlock(
            `// check Redis is operating
          const redisClient = getRedisClient();
          await redisClient.ping();`,
            "import { getRedisClient } from '%fastify-redis'",
            { importMappers: [{ getImportMap: () => importMap }] },
          ),
        );

        return {
          providers: {
            fastifyRedis: {
              getImportMap: () => ({
                '%fastify-redis': {
                  path: redisImport,
                  allowedImports: ['getRedisClient', 'createRedisClient'],
                },
              }),
            },
          },
          build: async (builder) => {
            const redisFile = typescript.createTemplate({
              CONFIG: configService.getConfigExpression(),
            });
            await builder.apply(
              redisFile.renderToAction('redis.ts', redisPath),
            );

            if (vitest) {
              await builder.apply(
                typescript.createCopyAction({
                  source: 'mock-redis.ts',
                  destination: 'src/tests/scripts/mock-redis.ts',
                }),
              );
              vitest
                .getConfig()
                .appendUnique('setupFiles', [
                  './src/tests/scripts/mock-redis.ts',
                ]);
            }
          },
        };
      },
    }),
  }),
});
