import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  tsCodeFragment,
  tsHoistedFragment,
  tsImportBuilder,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/error-handler-service.generator.js';
import { fastifySentryProvider } from '@src/generators/core/fastify-sentry/fastify-sentry.generator.js';
import { yogaPluginConfigProvider } from '@src/generators/yoga/yoga-plugin/yoga-plugin.generator.js';

import { pothosConfigProvider } from '../pothos/pothos.generator.js';

const descriptorSchema = z.object({});

export const pothosSentryGenerator = createGenerator({
  name: 'pothos/pothos-sentry',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, [
        '@pothos/plugin-tracing',
        '@pothos/tracing-sentry',
      ]),
    }),
    main: createGeneratorTask({
      dependencies: {
        yogaPluginConfig: yogaPluginConfigProvider,
        errorHandlerService: errorHandlerServiceProvider,
        typescript: typescriptProvider,
      },
      run({ yogaPluginConfig, typescript, errorHandlerService }) {
        const [pluginImport, pluginPath] = makeImportAndFilePath(
          'src/plugins/graphql/useSentry.ts',
        );

        yogaPluginConfig.envelopPlugins.set(
          'useSentry',
          tsCodeFragment(`useSentry()`, [
            tsImportBuilder(['useSentry']).from(pluginImport),
          ]),
        );

        return {
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'useSentry.ts',
                destination: pluginPath,
                importMappers: [errorHandlerService],
              }),
            );
          },
        };
      },
    }),
    sentry: createGeneratorTask({
      dependencies: {
        fastifyServerSentry: fastifySentryProvider.dependency(),
      },
      run({ fastifyServerSentry }) {
        fastifyServerSentry.addShouldLogToSentryBlock(
          TypescriptCodeUtils.createBlock(
            `
          if (error instanceof GraphQLError) {
            return (
              !error.extensions?.http?.status || error.extensions?.http?.status >= 500
            );
          }
          `,
            `import { GraphQLError } from 'graphql';`,
          ),
        );

        return {};
      },
    }),
    pothosPlugin: createGeneratorTask({
      dependencies: {
        pothosConfig: pothosConfigProvider,
      },
      run: ({ pothosConfig }) => {
        pothosConfig.pothosPlugins.set(
          'TracingPlugin',

          tsCodeFragment(
            `TracingPlugin`,
            tsImportBuilder()
              .default('TracingPlugin')
              .from('@pothos/plugin-tracing'),
          ),
        );
        pothosConfig.schemaBuilderOptions.set(
          'tracing',
          tsCodeFragment(
            `{
    default: (config) => isRootField(config),
    wrap: (resolver, options) => traceResolver(resolver, options),
  }`,
            tsImportBuilder(['isRootField']).from('@pothos/plugin-tracing'),
            {
              hoistedFragments: [
                tsHoistedFragment(
                  tsCodeFragment(
                    `const traceResolver = createSentryWrapper({
          includeSource: true,
          ignoreError: true,
        });`,
                    tsImportBuilder(['createSentryWrapper']).from(
                      '@pothos/tracing-sentry',
                    ),
                  ),
                  'traceResolver',
                ),
              ],
            },
          ),
        );

        return {};
      },
    }),
  }),
});
