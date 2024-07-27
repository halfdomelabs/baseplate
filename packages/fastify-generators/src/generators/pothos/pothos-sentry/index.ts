import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { pothosSetupProvider } from '../pothos/index.js';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { fastifySentryProvider } from '@src/generators/core/fastify-sentry/index.js';
import { yogaPluginSetupProvider } from '@src/generators/yoga/yoga-plugin/index.js';

const descriptorSchema = z.object({});

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    yogaPluginSetup: yogaPluginSetupProvider,
    errorHandlerService: errorHandlerServiceProvider,
    typescript: typescriptProvider,
    node: nodeProvider,
  },
  run({ yogaPluginSetup, typescript, errorHandlerService, node }) {
    const [pluginImport, pluginPath] = makeImportAndFilePath(
      'src/plugins/graphql/useSentry.ts',
    );

    yogaPluginSetup
      .getConfig()
      .appendUnique('envelopPlugins', [
        new TypescriptCodeExpression(`useSentry()`, [
          `import { useSentry } from '${pluginImport}'`,
        ]),
      ]);

    node.addPackages({
      '@pothos/plugin-tracing': '1.0.2',
      '@pothos/tracing-sentry': '1.0.3',
    });

    return {
      getProviders: () => ({}),
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
}));

const PothosSentryGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));

    taskBuilder.addTask({
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
    });

    taskBuilder.addTask({
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
    });
  },
});

export default PothosSentryGenerator;
