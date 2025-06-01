import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
  vitestConfigProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import path from 'node:path/posix';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';

import {
  configServiceImportsProvider,
  configServiceProvider,
} from '../config-service/config-service.generator.js';
import { fastifyHealthCheckConfigProvider } from '../fastify-health-check/fastify-health-check.generator.js';
import {
  createFastifyRedisImports,
  fastifyRedisImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_FASTIFY_REDIS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  defaultUrl: z.string().min(1),
});

const redisPath = '@/src/services/redis.ts';

export const fastifyRedisGenerator = createGenerator({
  name: 'core/fastify-redis',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ defaultUrl }) => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['ioredis']),
      dev: extractPackageVersions(FASTIFY_PACKAGES, ['ioredis-mock']),
    }),
    imports: createGeneratorTask({
      exports: {
        fastifyRedisImports: fastifyRedisImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            fastifyRedisImports: createFastifyRedisImports(
              path.dirname(redisPath),
            ),
          },
        };
      },
    }),
    configService: createProviderTask(
      configServiceProvider,
      (configService) => {
        configService.configFields.set('REDIS_URL', {
          validator: tsCodeFragment('z.string().min(1)'),
          comment: 'Connection URL of Redis',
          exampleValue: defaultUrl,
        });
      },
    ),
    fastifyHealthCheck: createProviderTask(
      fastifyHealthCheckConfigProvider,
      (fastifyHealthCheckConfig) => {
        fastifyHealthCheckConfig.healthChecks.set(
          'redis',
          tsCodeFragment(
            `// check Redis is operating
          const redisClient = getRedisClient();
          await redisClient.ping();`,
            tsImportBuilder(['getRedisClient']).from(redisPath),
          ),
        );
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        configServiceImports: configServiceImportsProvider,
        typescriptFile: typescriptFileProvider,
        vitestConfig: vitestConfigProvider.dependency().optional(),
      },
      run({ configServiceImports, typescriptFile, vitestConfig }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_FASTIFY_REDIS_TS_TEMPLATES.redis,
                destination: redisPath,
                importMapProviders: {
                  configServiceImports,
                },
              }),
            );

            if (vitestConfig) {
              const mockRedisPath = '@/src/tests/scripts/mock-redis.ts';
              await builder.apply(
                typescriptFile.renderTemplateFile({
                  template: CORE_FASTIFY_REDIS_TS_TEMPLATES.mockRedis,
                  destination: mockRedisPath,
                  importMapProviders: {},
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

export { fastifyRedisImportsProvider } from './generated/ts-import-maps.js';
