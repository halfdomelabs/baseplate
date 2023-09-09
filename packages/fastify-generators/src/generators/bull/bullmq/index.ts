import {
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { fastifyOutputProvider } from '@src/generators/core/fastify/index.js';
import { fastifyRedisProvider } from '@src/generators/core/fastify-redis/index.js';
import { loggerServiceProvider } from '@src/generators/core/logger-service/index.js';

const descriptorSchema = z.object({});

export type BullMqProvider = unknown;

export const bullMqProvider = createProviderType<BullMqProvider>('bull-mq');

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    errorHandlerService: errorHandlerServiceProvider,
    loggerService: loggerServiceProvider,
    fastifyRedis: fastifyRedisProvider,
    node: nodeProvider,
    typescript: typescriptProvider,
    fastifyOutput: fastifyOutputProvider,
  },
  exports: {
    bullMq: bullMqProvider,
  },
  run({
    errorHandlerService,
    loggerService,
    fastifyRedis,
    node,
    typescript,
    fastifyOutput,
  }) {
    node.addPackages({
      bullmq: '4.2.1',
    });

    node.addScripts({
      'dev:workers': `tsx watch --clear-screen=false ${fastifyOutput.getDevLoaderString()} ./scripts/run-workers.ts | pino-pretty -t`,
      'run:workers': 'pnpm run:script ./scripts/run-workers.ts',
    });

    return {
      getProviders: () => ({
        bullMq: {},
      }),
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
          })
        );

        const workersFile = typescript.createTemplate(
          {
            WORKERS: TypescriptCodeUtils.createExpression('[]'),
          },
          {
            importMappers,
          }
        );

        await builder.apply(
          workersFile.renderToAction(
            'scripts/run-workers.ts',
            'scripts/run-workers.ts'
          )
        );

        const repeatJobsFile = typescript.createTemplate(
          {
            REPEAT_JOBS: TypescriptCodeUtils.createExpression('[]'),
          },
          {
            importMappers,
          }
        );

        await builder.apply(
          repeatJobsFile.renderToAction(
            'scripts/synchronize-repeat-jobs.ts',
            'scripts/synchronize-repeat-jobs.ts'
          )
        );
      },
    };
  },
}));

const BullMqGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default BullMqGenerator;
