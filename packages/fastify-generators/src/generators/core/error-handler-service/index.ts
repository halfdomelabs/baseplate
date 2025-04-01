import type {
  ImportMapper,
  TypescriptCodeExpression,
  TypescriptSourceFile,
} from '@halfdomelabs/core-generators';

import {
  createTypescriptTemplateConfig,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  copyFileAction,
  createGenerator,
  createGeneratorTask,
  createProviderType,
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
}

export const errorHandlerServiceProvider =
  createProviderType<ErrorHandlerServiceProvider>('error-handler-service', {
    isReadOnly: true,
  });

export const errorHandlerServiceGenerator = createGenerator({
  name: 'core/error-handler-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,

  buildTasks: () => [
    createGeneratorTask({
      name: 'setup',
      dependencies: {
        loggerService: loggerServiceProvider,
        fastifyServer: fastifyServerProvider,
        typescript: typescriptProvider,
        configService: configServiceProvider,
      },
      exports: {
        errorHandlerServiceSetup:
          errorHandlerServiceSetupProvider.export(projectScope),
      },
      run({ loggerService, fastifyServer, typescript, configService }) {
        const errorLoggerFile = typescript.createTemplate(
          errorHandlerFileConfig,
        );

        fastifyServer.registerPlugin({
          name: 'errorHandlerPlugin',
          plugin: TypescriptCodeUtils.createExpression(
            'errorHandlerPlugin',
            "import { errorHandlerPlugin } from '@/src/plugins/error-handler.js'",
          ),
          orderPriority: 'EARLY',
        });

        const errorFunction = TypescriptCodeUtils.createExpression(
          'logError',
          "import { logError } from '@/src/services/error-logger.js'",
        );

        fastifyServer.getConfig().set('errorHandlerFunction', errorFunction);

        return {
          providers: {
            errorHandlerServiceSetup: {
              getHandlerFile: () => errorLoggerFile,
            },
          },
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

            await builder.apply(
              copyFileAction({
                source: 'utils/zod.ts',
                destination: 'src/utils/zod.ts',
                shouldFormat: true,
              }),
            );
          },
        };
      },
    }),
    createGeneratorTask({
      name: 'main',
      exports: {
        errorHandlerService: errorHandlerServiceProvider.export(projectScope),
      },
      run() {
        const errorFunction = TypescriptCodeUtils.createExpression(
          'logError',
          "import { logError } from '@/src/services/error-logger.js'",
        );

        const importMap = {
          '%http-errors': {
            path: `@/src/utils/http-errors.js`,
            allowedImports: Object.values(ERROR_MAP),
          },
          '%error-logger': {
            path: '@/src/services/error-logger.js',
            allowedImports: ['logError'],
          },
          '%utils-zod': {
            path: '@/src/utils/zod.js',
            allowedImports: ['handleZodRequestValidationError'],
          },
        };

        return {
          providers: {
            errorHandlerService: {
              getErrorFunction: () => errorFunction,
              getHttpErrorsImport: () => '@/src/utils/http-errors.js',
              getImportMap: () => importMap,
            },
          },
        };
      },
    }),
  ],
});
