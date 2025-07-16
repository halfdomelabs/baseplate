import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  tsTypeImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';

import { appModuleConfigProvider } from '../app-module-setup/index.js';
import { appModuleImportsProvider } from '../app-module/index.js';
import { configServiceProvider } from '../config-service/index.js';
import { CORE_FASTIFY_SERVER_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  defaultPort: z.number().default(7001),
});

export interface FastifyServerPlugin {
  plugin: TsCodeFragment;
  options?: TsCodeFragment;
  orderPriority?: 'EARLY' | 'MIDDLE' | 'END';
}

const [
  setupTask,
  fastifyServerConfigProvider,
  fastifyServerConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    /**
     * Function to handle errors.
     */
    errorHandlerFunction: t.scalar<TsCodeFragment>(),
    /**
     * Fragments to be inserted before the imports.
     */
    initializerFragments: t.map<string, TsCodeFragment>(),
    /**
     * Fastify plugins to be registered.
     */
    plugins: t.map<string, FastifyServerPlugin>(),
    /**
     * Fragments to be inserted before the plugins.
     */
    prePluginFragments: t.map<string, TsCodeFragment>(),
  }),
  {
    prefix: 'fastify-server',
    configScope: packageScope,
  },
);

export { fastifyServerConfigProvider };

export const fastifyServerGenerator = createGenerator({
  name: 'core/fastify-server',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    paths: CORE_FASTIFY_SERVER_GENERATED.paths.task,
    renderers: CORE_FASTIFY_SERVER_GENERATED.renderers.task,
    setupTask,
    appModuleConfig: createGeneratorTask({
      dependencies: {
        appModuleConfig: appModuleConfigProvider,
      },
      run({ appModuleConfig }) {
        appModuleConfig.moduleFields.set(
          'plugins',
          tsCodeFragment(
            '(FastifyPluginCallback | FastifyPluginAsync)',
            tsTypeImportBuilder([
              'FastifyPluginAsync',
              'FastifyPluginCallback',
            ]).from('fastify'),
          ),
        );
      },
    }),
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, [
        'fastify',
        '@fastify/helmet',
        'fastify-plugin',
        'nanoid',
      ]),
    }),
    config: createProviderTask(configServiceProvider, (configService) => {
      configService.configFields.mergeObj({
        SERVER_HOST: {
          comment: 'Hostname to bind the server to',
          validator: tsCodeFragment('z.string().default("localhost")'),
        },
        SERVER_PORT: {
          comment: 'Port to bind the server to',
          validator: tsCodeFragment(
            `z.coerce.number().min(1).max(65_535).default(${descriptor.defaultPort})`,
          ),
        },
      });
    }),
    main: createGeneratorTask({
      dependencies: {
        appModuleImports: appModuleImportsProvider,
        fastifyServerConfigValues: fastifyServerConfigValuesProvider,
        renderers: CORE_FASTIFY_SERVER_GENERATED.renderers.provider,
      },
      run({ appModuleImports, fastifyServerConfigValues, renderers }) {
        const {
          plugins,
          prePluginFragments,
          initializerFragments,
          errorHandlerFunction = 'console.error',
        } = fastifyServerConfigValues;

        plugins.set('helmet', {
          plugin: tsCodeFragment(
            'helmet',
            tsImportBuilder().default('helmet').from('@fastify/helmet'),
          ),
          orderPriority: 'EARLY',
        });

        return {
          build: async (builder) => {
            await builder.apply(
              renderers.index.render({
                variables: {
                  TPL_LOG_ERROR: TsCodeUtils.template`${errorHandlerFunction}(err)`,
                },
                positionedHoistedFragments: [
                  ...initializerFragments.entries(),
                ].map(([key, fragment]) => ({
                  ...fragment,
                  key,
                  position: 'beforeImports',
                })),
              }),
            );

            const ORDER_PRIORITY_MAP = { EARLY: 0, MIDDLE: 1, END: 2 };
            const orderedPlugins = sortBy(
              [...plugins.entries()],
              [
                ([, plugin]) =>
                  ORDER_PRIORITY_MAP[plugin.orderPriority ?? 'MIDDLE'],
                ([name]) => name,
              ],
            );

            await builder.apply(
              renderers.server.render({
                variables: {
                  TPL_ROOT_MODULE: appModuleImports.getModuleFragment(),
                  TPL_PRE_PLUGIN_FRAGMENTS:
                    TsCodeUtils.mergeFragments(prePluginFragments),
                  TPL_PLUGINS: TsCodeUtils.mergeFragmentsPresorted(
                    orderedPlugins.map(
                      ([, plugin]) =>
                        TsCodeUtils.template`await fastify.register(${plugin.plugin}, ${
                          plugin.options ?? ''
                        });`,
                    ),
                  ),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
