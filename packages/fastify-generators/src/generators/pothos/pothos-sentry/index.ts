import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { fastifySentryProvider } from '@src/generators/core/fastify-sentry/index.js';
import { yogaPluginConfigProvider } from '@src/generators/yoga/yoga-plugin/index.js';

import { pothosSetupProvider } from '../pothos/index.js';

const descriptorSchema = z.object({});

export const pothosSentryGenerator = createGenerator({
  name: 'pothos/pothos-sentry',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        yogaPluginConfig: yogaPluginConfigProvider,
        errorHandlerService: errorHandlerServiceProvider,
        typescript: typescriptProvider,
        node: nodeProvider,
      },
      run({ yogaPluginConfig, typescript, errorHandlerService, node }) {
        const [pluginImport, pluginPath] = makeImportAndFilePath(
          'src/plugins/graphql/useSentry.ts',
        );

        yogaPluginConfig.envelopPlugins.push(
          new TypescriptCodeExpression(`useSentry()`, [
            `import { useSentry } from '${pluginImport}'`,
          ]),
        );

        node.addPackages({
          '@pothos/plugin-tracing': '1.1.0',
          '@pothos/tracing-sentry': '1.1.1',
        });

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
    createGeneratorTask({
      name: 'sentry',
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
    createGeneratorTask({
      name: 'pothos-plugin',
      dependencies: {
        pothosSetupProvider,
      },
      run: ({ pothosSetupProvider }) => {
        pothosSetupProvider
          .getConfig()
          .appendUnique('pothosPlugins', [
            new TypescriptCodeExpression(
              `TracingPlugin`,
              `import TracingPlugin from '@pothos/plugin-tracing'`,
            ),
          ]);

        pothosSetupProvider.getConfig().append('schemaBuilderOptions', {
          key: 'tracing',
          value: TypescriptCodeUtils.createExpression(
            `{
    default: (config) => isRootField(config),
    wrap: (resolver, options) => traceResolver(resolver, options),
  }`,
            [`import {isRootField} from '@pothos/plugin-tracing'`],
            {
              headerBlocks: [
                TypescriptCodeUtils.createBlock(
                  `const traceResolver = createSentryWrapper({
  includeSource: true,
  ignoreError: true,
});`,
                  `import { createSentryWrapper } from '@pothos/tracing-sentry';`,
                ),
              ],
            },
          ),
        });

        return {};
      },
    }),
  ],
});
