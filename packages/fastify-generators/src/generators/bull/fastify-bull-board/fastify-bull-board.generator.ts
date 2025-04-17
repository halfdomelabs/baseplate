import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeProvider,
  projectScope,
  TypescriptCodeExpression,
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
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/error-handler-service.generator.js';
import { fastifyRedisProvider } from '@src/generators/core/fastify-redis/fastify-redis.generator.js';
import { fastifyServerProvider } from '@src/generators/core/fastify-server/fastify-server.generator.js';
import { appModuleProvider } from '@src/generators/core/root-module/root-module.generator.js';
import { pothosSchemaProvider } from '@src/generators/pothos/pothos/pothos.generator.js';

const descriptorSchema = z.object({});

export interface FastifyBullBoardProvider {
  addQueueToTrack(queue: TypescriptCodeExpression): void;
}

export const fastifyBullBoardProvider =
  createProviderType<FastifyBullBoardProvider>('fastify-bull-board');

export const fastifyBullBoardGenerator = createGenerator({
  name: 'bull/fastify-bull-board',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, [
        '@bull-board/api',
        '@bull-board/fastify',
        'ms',
      ]),
      dev: extractPackageVersions(FASTIFY_PACKAGES, [
        '@types/redis-info',
        '@types/ms',
      ]),
    }),
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        errorHandlerService: errorHandlerServiceProvider,
        redis: fastifyRedisProvider,
        pothosSchema: pothosSchemaProvider,
        appModule: appModuleProvider,
      },
      exports: {
        fastifyBullBoard: fastifyBullBoardProvider.export(projectScope),
      },
      run({ typescript, errorHandlerService, redis, pothosSchema, appModule }) {
        const queuesToTrack: TypescriptCodeExpression[] = [];

        const moduleFolder = `${appModule.getModuleFolder()}/bull-board`;

        pothosSchema.registerSchemaFile(
          `${moduleFolder}/schema/authenticate.mutations.ts`,
        );

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
    }),
    formBody: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        fastifyServer: fastifyServerProvider,
      },
      run({ node, fastifyServer }) {
        node.packages.addProdPackages(
          extractPackageVersions(FASTIFY_PACKAGES, ['@fastify/formbody']),
        );

        fastifyServer.registerPlugin({
          name: 'formBodyPlugin',
          plugin: new TypescriptCodeExpression(
            'formBodyPlugin',
            "import formBodyPlugin from '@fastify/formbody'",
          ),
        });

        return {};
      },
    }),
  }),
});
