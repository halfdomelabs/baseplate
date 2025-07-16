import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeProvider,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
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
import { fastifyServerConfigProvider } from '#src/generators/core/fastify-server/index.js';
import { pothosSchemaProvider } from '#src/generators/pothos/pothos/index.js';

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
    renderers: BULL_FASTIFY_BULL_BOARD_GENERATED.renderers.task,
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
        pothosSchema: pothosSchemaProvider,
        appModule: appModuleProvider,
        fastifyBullBoardConfigValues: fastifyBullBoardConfigValuesProvider,
        renderers: BULL_FASTIFY_BULL_BOARD_GENERATED.renderers.provider,
      },
      run({
        pothosSchema,
        appModule,
        fastifyBullBoardConfigValues: { queuesToTrack },
        renderers,
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
              renderers.moduleGroup.render({
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
