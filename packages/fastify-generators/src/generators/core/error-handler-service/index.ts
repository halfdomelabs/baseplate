import {
  createTypescriptTemplateConfig,
  ImportMapper,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptSourceFile,
} from '@halfdomelabs/core-generators';
import {
  copyFileAction,
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { configServiceProvider } from '../config-service/index.js';
import { fastifyServerProvider } from '../fastify-server/index.js';
import { loggerServiceProvider } from '../logger-service/index.js';

const descriptorSchema = z.object({});

const errorHandlerFileConfig = createTypescriptTemplateConfig({
  HEADER: { type: 'code-block' },
  CONTEXT_ACTIONS: { type: 'code-block' },
  LOGGER_ACTIONS: { type: 'code-block' },
});

const ERROR_MAP = {
  http: 'HttpError',
  badRequest: 'BadRequestError',
  unauthorized: 'UnauthorizedError',
  forbidden: 'ForbiddenError',
  notFound: 'NotFoundError',
};

export interface ErrorHandlerServiceSetupProvider {
  getHandlerFile(): TypescriptSourceFile<typeof errorHandlerFileConfig>;
}

export const errorHandlerServiceSetupProvider =
  createProviderType<ErrorHandlerServiceSetupProvider>(
    'error-handler-service-setup',
  );

export interface ErrorHandlerServiceProvider extends ImportMapper {
  getHttpErrorsImport(): string;
  getErrorFunction(): TypescriptCodeExpression;
  getHttpErrorExpression(
    error: keyof typeof ERROR_MAP,
  ): TypescriptCodeExpression;
}

export const errorHandlerServiceProvider =
  createProviderType<ErrorHandlerServiceProvider>('error-handler-service', {
    isReadOnly: true,
  });

const createSetupTask = createTaskConfigBuilder(() => ({
  name: 'setup',
  dependencies: {
    loggerService: loggerServiceProvider,
    fastifyServer: fastifyServerProvider,
    typescript: typescriptProvider,
    configService: configServiceProvider,
  },
  exports: {
    errorHandlerServiceSetup: errorHandlerServiceSetupProvider,
  },
  run({ loggerService, fastifyServer, typescript, configService }) {
    const errorLoggerFile = typescript.createTemplate(errorHandlerFileConfig);

    fastifyServer.registerPlugin({
      name: 'errorHandlerPlugin',
      plugin: TypescriptCodeUtils.createExpression(
        'errorHandlerPlugin',
        "import { errorHandlerPlugin } from '@/src/plugins/error-handler'",
      ),
      orderPriority: 'EARLY',
    });

    const errorFunction = TypescriptCodeUtils.createExpression(
      'logError',
      "import { logError } from '@/src/services/error-logger'",
    );

    fastifyServer.getConfig().set('errorHandlerFunction', errorFunction);

    return {
      getProviders: () => ({
        errorHandlerServiceSetup: {
          getHandlerFile: () => errorLoggerFile,
        },
      }),
      build: async (builder) => {
        errorLoggerFile.addCodeBlock(
          'LOGGER_ACTIONS',
          TypescriptCodeUtils.toBlock(
            TypescriptCodeUtils.wrapExpression(
              loggerService.getLogger(),
              (code) => `${code}.error({ err: error, ...context });`,
            ),
          ),
        );

        await builder.apply(
          typescript.createCopyAction({
            source: 'plugins/error-handler.ts',
            destination: 'src/plugins/error-handler.ts',
            importMappers: [configService],
          }),
        );

        await builder.apply(
          errorLoggerFile.renderToAction(
            'services/error-logger.ts',
            'src/services/error-logger.ts',
          ),
        );

        await builder.apply(
          copyFileAction({
            source: 'utils/http-errors.ts',
            destination: 'src/utils/http-errors.ts',
            shouldFormat: true,
          }),
        );
      },
    };
  },
}));

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  exports: {
    errorHandlerService: errorHandlerServiceProvider,
  },
  run() {
    const errorFunction = TypescriptCodeUtils.createExpression(
      'logError',
      "import { logError } from '@/src/services/error-logger'",
    );

    const importMap = {
      '%http-errors': {
        path: `@/src/utils/http-errors`,
        allowedImports: Object.values(ERROR_MAP),
      },
      '%error-logger': {
        path: '@/src/services/error-logger',
        allowedImports: ['logError'],
      },
    };

    return {
      getProviders: () => ({
        errorHandlerService: {
          getErrorFunction: () => errorFunction,
          getHttpErrorsImport: () => '@/src/utils/http-errors',
          getHttpErrorExpression: (error) =>
            new TypescriptCodeExpression(
              ERROR_MAP[error],
              `import { ${ERROR_MAP[error]} } from '@/src/utils/http-errors'`,
            ),
          getImportMap: () => importMap,
        },
      }),
    };
  },
}));

const ErrorHandlerServiceGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),

  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createSetupTask(descriptor));
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default ErrorHandlerServiceGenerator;
