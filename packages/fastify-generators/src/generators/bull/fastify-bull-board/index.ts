import {
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { fastifyRedisProvider } from '@src/generators/core/fastify-redis';
import { fastifyServerProvider } from '@src/generators/core/fastify-server';
import { appModuleProvider } from '@src/generators/core/root-module';
import { pothosSchemaProvider } from '@src/generators/pothos/pothos';

const descriptorSchema = z.object({});

export interface FastifyBullBoardProvider {
  addQueueToTrack(queue: TypescriptCodeExpression): void;
}

export const fastifyBullBoardProvider =
  createProviderType<FastifyBullBoardProvider>('fastify-bull-board');

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
    errorHandlerService: errorHandlerServiceProvider,
    redis: fastifyRedisProvider,
    pothosSchema: pothosSchemaProvider,
    appModule: appModuleProvider,
  },
  exports: {
    fastifyBullBoard: fastifyBullBoardProvider,
  },
  run({
    node,
    typescript,
    errorHandlerService,
    redis,
    pothosSchema,
    appModule,
  }) {
    const queuesToTrack: TypescriptCodeExpression[] = [];

    pothosSchema.registerSchemaFile(
      `${appModule.getModuleFolder()}/schema/authenticate.mutations.ts`
    );

    node.addPackages({
      '@bull-board/api': '4.3.2',
      '@bull-board/fastify': '4.3.2',
      ms: '2.1.3',
    });

    // required for bull-board to compile
    node.addDevPackages({
      '@types/redis-info': '3.0.0',
      '@types/ms': '0.7.31',
    });

    return {
      getProviders: () => ({
        fastifyBullBoard: {
          addQueueToTrack(queue) {
            queuesToTrack.push(queue);
          },
        },
      }),
      build: async (builder) => {
        const importMappers = [errorHandlerService, redis, pothosSchema];
        const pluginFile = typescript.createTemplate(
          {
            QUEUES_TO_TRACK:
              TypescriptCodeUtils.mergeExpressionsAsArray(queuesToTrack),
          },
          { importMappers }
        );

        const moduleFolder = `${appModule.getModuleFolder()}/bull-board`;

        appModule.registerFieldEntry(
          'children',
          TypescriptCodeUtils.createExpression(
            'bullBoardModule',
            `import { bullBoardModule } from '@/${moduleFolder}'`
          )
        );

        await builder.apply(
          pluginFile.renderToAction(
            'plugins/bull-board.ts',
            `${moduleFolder}/plugins/bull-board.ts`
          )
        );

        await builder.apply(
          typescript.createCopyFilesAction({
            destinationBaseDirectory: moduleFolder,
            paths: [
              'schema/authenticate.mutations.ts',
              'services/auth.service.ts',
              'index.ts',
            ],
            importMappers,
          })
        );
      },
    };
  },
}));

const FastifyBullBoardGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));

    taskBuilder.addTask({
      name: 'formBody',
      dependencies: {
        node: nodeProvider,
        fastifyServer: fastifyServerProvider,
      },
      run({ node, fastifyServer }) {
        node.addPackages({
          '@fastify/formbody': '7.3.0',
        });

        fastifyServer.registerPlugin({
          name: 'formBodyPlugin',
          plugin: new TypescriptCodeExpression(
            'formBodyPlugin',
            "import formBodyPlugin from '@fastify/formbody'"
          ),
        });

        return {};
      },
    });
  },
});

export default FastifyBullBoardGenerator;
