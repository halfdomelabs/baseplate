import {
  nodeProvider,
  projectScope,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { fastifyRedisProvider } from '@src/generators/core/fastify-redis/index.js';
import { fastifyServerProvider } from '@src/generators/core/fastify-server/index.js';
import { appModuleProvider } from '@src/generators/core/root-module/index.js';
import { pothosSchemaProvider } from '@src/generators/pothos/pothos/index.js';

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
    fastifyBullBoard: fastifyBullBoardProvider.export(projectScope),
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

    const moduleFolder = `${appModule.getModuleFolder()}/bull-board`;

    pothosSchema.registerSchemaFile(
      `${moduleFolder}/schema/authenticate.mutations.ts`,
    );

    node.addPackages({
      '@bull-board/api': '6.5.3',
      '@bull-board/fastify': '6.5.3',
      ms: '2.1.3',
    });

    // required for bull-board to compile
    node.addDevPackages({
      '@types/redis-info': '3.0.3',
      '@types/ms': '0.7.34',
    });

    return {
      providers: {
        fastifyBullBoard: {
          addQueueToTrack(queue) {
            queuesToTrack.push(queue);
          },
        },
      },
      build: async (builder) => {
        const importMappers = [errorHandlerService, redis, pothosSchema];
        const pluginFile = typescript.createTemplate(
          {
            QUEUES_TO_TRACK:
              TypescriptCodeUtils.mergeExpressionsAsArray(queuesToTrack),
          },
          { importMappers },
        );

        appModule.registerFieldEntry(
          'children',
          TypescriptCodeUtils.createExpression(
            'bullBoardModule',
            `import { bullBoardModule } from '@/${moduleFolder}/index.js'`,
          ),
        );

        await builder.apply(
          pluginFile.renderToAction(
            'plugins/bull-board.ts',
            `${moduleFolder}/plugins/bull-board.ts`,
          ),
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
          }),
        );
      },
    };
  },
}));

export const fastifyBullBoardGenerator = createGenerator({
  name: 'bull/fastify-bull-board',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
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
          '@fastify/formbody': '8.0.1',
        });

        fastifyServer.registerPlugin({
          name: 'formBodyPlugin',
          plugin: new TypescriptCodeExpression(
            'formBodyPlugin',
            "import formBodyPlugin from '@fastify/formbody'",
          ),
        });

        return {};
      },
    });
  },
});
