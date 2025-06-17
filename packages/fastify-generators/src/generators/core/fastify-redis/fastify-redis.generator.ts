import {
  createNodePackagesTask,
  extractPackageVersions,
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
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';

import {
  configServiceImportsProvider,
  configServiceProvider,
} from '../config-service/index.js';
import { fastifyHealthCheckConfigProvider } from '../fastify-health-check/index.js';
import { CORE_FASTIFY_REDIS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  defaultUrl: z.string().min(1),
});

export const fastifyRedisGenerator = createGenerator({
  name: 'core/fastify-redis',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ defaultUrl }) => ({
    paths: CORE_FASTIFY_REDIS_GENERATED.paths.task,
    imports: CORE_FASTIFY_REDIS_GENERATED.imports.task,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['ioredis']),
      dev: extractPackageVersions(FASTIFY_PACKAGES, ['ioredis-mock']),
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
    fastifyHealthCheck: createGeneratorTask({
      dependencies: {
        fastifyHealthCheckConfig: fastifyHealthCheckConfigProvider,
        paths: CORE_FASTIFY_REDIS_GENERATED.paths.provider,
      },
      run({ fastifyHealthCheckConfig, paths }) {
        fastifyHealthCheckConfig.healthChecks.set(
          'redis',
          tsCodeFragment(
            `// check Redis is operating
          const redisClient = getRedisClient();
          await redisClient.ping();`,
            tsImportBuilder(['getRedisClient']).from(paths.redis),
          ),
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        configServiceImports: configServiceImportsProvider,
        typescriptFile: typescriptFileProvider,
        vitestConfig: vitestConfigProvider.dependency().optional(),
        paths: CORE_FASTIFY_REDIS_GENERATED.paths.provider,
      },
      run({ configServiceImports, typescriptFile, vitestConfig, paths }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_FASTIFY_REDIS_GENERATED.templates.redis,
                destination: paths.redis,
                importMapProviders: {
                  configServiceImports,
                },
              }),
            );

            if (vitestConfig) {
              await builder.apply(
                typescriptFile.renderTemplateFile({
                  template: CORE_FASTIFY_REDIS_GENERATED.templates.mockRedis,
                  destination: paths.mockRedis,
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
