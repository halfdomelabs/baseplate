import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeProvider,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import path from 'node:path';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { appModuleProvider } from '#src/generators/core/app-module/index.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/index.js';
import { fastifyRedisImportsProvider } from '#src/generators/core/fastify-redis/index.js';
import { fastifyServerConfigProvider } from '#src/generators/core/fastify-server/index.js';
import {
  pothosImportsProvider,
  pothosSchemaProvider,
} from '#src/generators/pothos/pothos/index.js';

import { BULL_FASTIFY_BULL_BOARD_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

const [
  setupTask,
  fastifyBullBoardConfigProvider,
  fastifyBullBoardConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    queuesToTrack: t.map<string, TsCodeFragment>(),
  }),
  {
    prefix: 'fastify-bull-board',
    configScope: packageScope,
  },
);

export { fastifyBullBoardConfigProvider };

export const fastifyBullBoardGenerator = createGenerator({
  name: 'bull/fastify-bull-board',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: BULL_FASTIFY_BULL_BOARD_GENERATED.paths.task,
    setup: setupTask,
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
        typescriptFile: typescriptFileProvider,
        paths: BULL_FASTIFY_BULL_BOARD_GENERATED.paths.provider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        fastifyRedisImports: fastifyRedisImportsProvider,
        pothosSchema: pothosSchemaProvider,
        pothosImports: pothosImportsProvider,
        appModule: appModuleProvider,
        fastifyBullBoardConfigValues: fastifyBullBoardConfigValuesProvider,
      },
      run({
        typescriptFile,
        paths,
        errorHandlerServiceImports,
        fastifyRedisImports,
        pothosSchema,
        pothosImports,
        appModule,
        fastifyBullBoardConfigValues: { queuesToTrack },
      }) {
        const moduleFolder = path.posix.join(
          appModule.getModuleFolder(),
          'bull-board',
        );

        pothosSchema.registerSchemaFile(
          `${moduleFolder}/schema/authenticate.mutations.ts`,
        );

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: BULL_FASTIFY_BULL_BOARD_GENERATED.templates.moduleGroup,
                paths,
                importMapProviders: {
                  fastifyRedisImports,
                  errorHandlerServiceImports,
                  pothosImports,
                },
                variables: {
                  pluginsBullBoard: {
                    TPL_QUEUES:
                      TsCodeUtils.mergeFragmentsAsArray(queuesToTrack),
                  },
                },
              }),
            );

            appModule.moduleFields.set(
              'children',
              'bullBoardModule',
              tsCodeFragment(
                'bullBoardModule',
                tsImportBuilder(['bullBoardModule']).from(
                  `${moduleFolder}/index.js`,
                ),
              ),
            );
          },
        };
      },
    }),
    formBody: createGeneratorTask({
      dependencies: {
        node: nodeProvider,
        fastifyServerConfig: fastifyServerConfigProvider,
      },
      run({ node, fastifyServerConfig }) {
        node.packages.addProdPackages(
          extractPackageVersions(FASTIFY_PACKAGES, ['@fastify/formbody']),
        );

        fastifyServerConfig.plugins.set('formBodyPlugin', {
          plugin: tsCodeFragment(
            'formBodyPlugin',
            tsImportBuilder()
              .default('formBodyPlugin')
              .from('@fastify/formbody'),
          ),
        });

        return {};
      },
    }),
  }),
});
