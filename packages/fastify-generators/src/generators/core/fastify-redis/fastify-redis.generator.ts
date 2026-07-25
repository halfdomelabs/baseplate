import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  TsCodeUtils,
  typescriptFileProvider,
  vitestConfigProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
  normalizePathToOutputPath,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';

import { appRuntimeConfigProvider } from '../app-runtime/index.js';
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
    }),
    prefixEnv: createGeneratorTask({
      dependencies: {
        configService: configServiceProvider,
      },
      run({ configService }) {
        configService.configFields.set('REDIS_KEY_PREFIX', {
          validator: tsCodeFragment("z.string().default('')"),
          comment: 'Redis key prefix for namespace isolation (optional)',
          exampleValue: '',
        });
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
    fastifyHealthCheck: createGeneratorTask({
      dependencies: {
        fastifyHealthCheckConfig: fastifyHealthCheckConfigProvider,
      },
      run({ fastifyHealthCheckConfig }) {
        fastifyHealthCheckConfig.healthChecks.set(
          'redis',
          tsCodeFragment(
            `// check Redis is operating
          await opts.runtime.redis.healthCheck();`,
          ),
        );
      },
    }),
    appRuntimeConfig: createGeneratorTask({
      dependencies: {
        appRuntimeConfig: appRuntimeConfigProvider,
        paths: CORE_FASTIFY_REDIS_GENERATED.paths.provider,
      },
      run({ appRuntimeConfig, paths }) {
        appRuntimeConfig.runtimeFields.set('redis', {
          type: TsCodeUtils.typeImportFragment('RedisRuntime', paths.redis),
          comment:
            '/** Runtime-internal: connection lifecycle, not for feature code. */',
        });
        // FIRST so it is torn down only after slices that opened connections
        // through it have released theirs - disposal runs in reverse
        // construction order, and not every such slice declares an edge here.
        appRuntimeConfig.construction.set('redis', {
          orderPriority: 'FIRST',
          fragment: TsCodeUtils.template`
            const redis = ${TsCodeUtils.importFragment('createRedisRuntime', paths.redis)}();
            disposers.push({ name: 'redis', dispose: () => redis.dispose() });
          `,
        });
      },
    }),
    renderers: CORE_FASTIFY_REDIS_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        configServiceImports: configServiceImportsProvider,
        typescriptFile: typescriptFileProvider,
        vitestConfig: vitestConfigProvider.dependency().optional(),
        paths: CORE_FASTIFY_REDIS_GENERATED.paths.provider,
        renderers: CORE_FASTIFY_REDIS_GENERATED.renderers.provider,
      },
      run({
        configServiceImports,
        typescriptFile,
        vitestConfig,
        paths,
        renderers,
      }) {
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
              await builder.apply(renderers.globalSetupRedis.render({}));
              vitestConfig.globalSetupFiles.push(
                normalizePathToOutputPath(paths.globalSetupRedis),
              );
            }
          },
        };
      },
    }),
  }),
});
