import {
  makeImportAndFilePath,
  TypescriptCodeExpression,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service/index.js';
import { fastifySentryProvider } from '@src/generators/core/fastify-sentry/index.js';
import { yogaPluginSetupProvider } from '@src/generators/yoga/yoga-plugin/index.js';

const descriptorSchema = z.object({});

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    yogaPluginSetup: yogaPluginSetupProvider,
    fastifySentry: fastifySentryProvider,
    errorHandlerService: errorHandlerServiceProvider,
    typescript: typescriptProvider,
  },
  run({ fastifySentry, yogaPluginSetup, typescript, errorHandlerService }) {
    const [pluginImport, pluginPath] = makeImportAndFilePath(
      'src/plugins/graphql/useSentry.ts'
    );
    yogaPluginSetup.getConfig().appendUnique('envelopPlugins', [
      new TypescriptCodeExpression(
        `useSentry({
            configureScope: (args, scope) => configureSentryScope(scope),
            skipError: (error) =>
              !shouldLogToSentry(
                error instanceof GraphQLError ? error.originalError || error : error
              ),
            eventIdKey: null,
          })`,
        [
          `import { useSentry } from '${pluginImport}'`,
          "import { configureSentryScope } from '%fastify-sentry/service';",
          "import { shouldLogToSentry } from '%fastify-sentry/logger';",
        ],
        { importMappers: [fastifySentry] }
      ),
    ]);
    ///
    return {
      getProviders: () => ({}),
      build: async (builder) => {
        await builder.apply(
          typescript.createCopyAction({
            source: 'useSentry.ts',
            destination: pluginPath,
            importMappers: [errorHandlerService],
          })
        );
      },
    };
  },
}));

const YogaSentryGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default YogaSentryGenerator;
