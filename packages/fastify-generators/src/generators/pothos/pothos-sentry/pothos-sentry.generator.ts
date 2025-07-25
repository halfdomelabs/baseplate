import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  tsHoistedFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';
import { fastifySentryConfigProvider } from '#src/generators/core/fastify-sentry/index.js';
import { yogaPluginConfigProvider } from '#src/generators/yoga/yoga-plugin/index.js';

import { pothosConfigProvider } from '../pothos/index.js';
import { POTHOS_POTHOS_SENTRY_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const pothosSentryGenerator = createGenerator({
  name: 'pothos/pothos-sentry',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: POTHOS_POTHOS_SENTRY_GENERATED.paths.task,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, [
        '@pothos/plugin-tracing',
        '@pothos/tracing-sentry',
      ]),
    }),
    main: createGeneratorTask({
      dependencies: {
        yogaPluginConfig: yogaPluginConfigProvider,
        typescriptFile: typescriptFileProvider,
        paths: POTHOS_POTHOS_SENTRY_GENERATED.paths.provider,
      },
      run({ yogaPluginConfig, typescriptFile, paths }) {
        yogaPluginConfig.envelopPlugins.set(
          'useSentry',
          tsCodeFragment(`useSentry()`, [
            tsImportBuilder(['useSentry']).from(paths.useSentry),
          ]),
        );

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_SENTRY_GENERATED.templates.useSentry,
                destination: paths.useSentry,
              }),
            );
          },
        };
      },
    }),
    sentry: createGeneratorTask({
      dependencies: {
        fastifySentryConfig: fastifySentryConfigProvider.dependency(),
      },
      run({ fastifySentryConfig }) {
        fastifySentryConfig.shouldLogToSentryFragments.set(
          'graphql',
          tsCodeFragment(
            `
          if (error instanceof GraphQLError) {
            return (
              !error.extensions.http?.status || error.extensions.http.status >= 500
            );
          }
          `,
            tsImportBuilder(['GraphQLError']).from('graphql'),
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
                  'traceResolver',
                  `const traceResolver = createSentryWrapper({
          includeSource: true,
          ignoreError: true,
        });`,
                  tsImportBuilder(['createSentryWrapper']).from(
                    '@pothos/tracing-sentry',
                  ),
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
