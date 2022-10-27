import {
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@baseplate/sync';
import { z } from 'zod';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { fastifyRedisProvider } from '@src/generators/core/fastify-redis';
import { loggerServiceProvider } from '@src/generators/core/logger-service';

const descriptorSchema = z.object({});

type Descriptor = z.infer<typeof descriptorSchema>;

export type BullMqProvider = unknown;

export const bullMqProvider = createProviderType<BullMqProvider>('bull-mq');

const createMainTask = createTaskConfigBuilder((descriptor: Descriptor) => ({
  name: 'main',
  dependencies: {
    errorHandlerService: errorHandlerServiceProvider,
    loggerService: loggerServiceProvider,
    fastifyRedis: fastifyRedisProvider,
    node: nodeProvider,
    typescript: typescriptProvider,
  },
  exports: {
    bullMq: bullMqProvider,
  },
  run({ errorHandlerService, loggerService, fastifyRedis, node, typescript }) {
    node.addPackages({
      bullmq: '2.1.2',
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
