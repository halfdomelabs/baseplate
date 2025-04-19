import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptProvider,
  vitestConfigProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

import { configServiceProvider } from '../config-service/config-service.generator.js';
import { fastifyHealthCheckConfigProvider } from '../fastify-health-check/fastify-health-check.generator.js';

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
        fastifyHealthCheckConfig: fastifyHealthCheckConfigProvider,
        typescript: typescriptProvider,
        vitestConfig: vitestConfigProvider.dependency().optional(),
      },
      exports: {
        fastifyRedis: fastifyRedisProvider.export(projectScope),
      },
      run({
        configService,
        fastifyHealthCheckConfig,
        typescript,
        vitestConfig,
      }) {
        const [redisImport, redisPath] = makeImportAndFilePath(
          `src/services/redis.ts`,
        );

        configService.configFields.set('REDIS_URL', {
          validator: tsCodeFragment('z.string().min(1)'),
          comment: 'Connection URL of Redis',
          exampleValue: defaultUrl,
        });
        fastifyHealthCheckConfig.healthChecks.set(
          'redis',
          tsCodeFragment(
            `// check Redis is operating
          const redisClient = getRedisClient();
          await redisClient.ping();`,
            tsImportBuilder(['getRedisClient']).from(redisImport),
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

            if (vitestConfig) {
              const mockRedisPath = 'src/tests/scripts/mock-redis.ts';
              await builder.apply(
                typescript.createCopyAction({
                  source: 'mock-redis.ts',
                  destination: mockRedisPath,
                }),
              );
              vitestConfig.setupFiles.push('tests/scripts/mock-redis.ts');
            }
          },
        };
      },
    }),
  }),
});
