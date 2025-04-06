import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeProvider,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { fastifyRedisProvider } from '@src/generators/core/fastify-redis/index.js';
import { fastifyOutputProvider } from '@src/generators/core/fastify/index.js';
import { loggerServiceProvider } from '@src/generators/core/logger-service/index.js';

const descriptorSchema = z.object({});

export type BullMqProvider = unknown;

export const bullMqProvider = createProviderType<BullMqProvider>('bull-mq');

export const bullMqGenerator = createGenerator({
  name: 'bull/bull-mq',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['bullmq']),
    }),
    main: createGeneratorTask({
      dependencies: {
        errorHandlerService: errorHandlerServiceProvider,
        loggerService: loggerServiceProvider,
        fastifyRedis: fastifyRedisProvider,
        node: nodeProvider,
        typescript: typescriptProvider,
        fastifyOutput: fastifyOutputProvider,
      },
      exports: {
        bullMq: bullMqProvider.export(projectScope),
      },
      run(
        {
          errorHandlerService,
          loggerService,
          fastifyRedis,
          node,
          typescript,
          fastifyOutput,
        },
        { taskId },
      ) {
        const devOutputFormatter = fastifyOutput.getDevOutputFormatter();
        const devWorkersCommand = [
          'tsx watch --clear-screen=false',
          ...fastifyOutput.getNodeFlagsDev(),
          './scripts/run-workers.ts',
          devOutputFormatter ? `| ${devOutputFormatter}` : '',
        ]
          .filter(Boolean)
          .join(' ');

        node.scripts.mergeObj(
          {
            'dev:workers': devWorkersCommand,
            'run:workers': 'pnpm run:script ./scripts/run-workers.ts',
          },
          taskId,
        );

        return {
          providers: {
            bullMq: {},
          },
          build: async (builder) => {
            const importMappers = [
              errorHandlerService,
              loggerService,
              fastifyRedis,
            ];

            await builder.apply(
              typescript.createCopyFilesAction({
                sourceBaseDirectory: 'services/bull',
                destinationBaseDirectory: 'src/services/bull',
                paths: ['index.ts', 'queue.ts', 'repeatable.ts', 'worker.ts'],
                importMappers,
              }),
            );

            const workersFile = typescript.createTemplate(
              {
                WORKERS: TypescriptCodeUtils.createExpression('[]'),
              },
              {
                importMappers,
              },
            );

            await builder.apply(
              workersFile.renderToAction(
                'scripts/run-workers.ts',
                'scripts/run-workers.ts',
              ),
            );

            const repeatJobsFile = typescript.createTemplate(
              {
                REPEAT_JOBS: TypescriptCodeUtils.createExpression('[]'),
              },
              {
                importMappers,
              },
            );

            await builder.apply(
              repeatJobsFile.renderToAction(
                'scripts/synchronize-repeat-jobs.ts',
                'scripts/synchronize-repeat-jobs.ts',
              ),
            );
          },
        };
      },
    }),
  }),
});
