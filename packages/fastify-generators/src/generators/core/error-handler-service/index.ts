import type {
  ImportMapper,
  TypescriptCodeExpression,
  TypescriptSourceFile,
} from '@halfdomelabs/core-generators';

import {
  createTypescriptTemplateConfig,
  projectScope,
  TypescriptCodeUtils,
  typescriptFileProvider,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  copyFileAction,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { configServiceImportsProvider } from '../config-service/config-service.generator.js';
import { fastifyServerProvider } from '../fastify-server/index.js';
import { loggerServiceProvider } from '../logger-service/logger-service.generator.js';
import { CORE_ERROR_HANDLER_SERVICE_TS_TEMPLATES } from './generated/ts-templates.js';

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

  buildTasks: () => ({
    setup: createGeneratorTask({
      dependencies: {
        configServiceImports: configServiceImportsProvider,
        loggerService: loggerServiceProvider,
        fastifyServer: fastifyServerProvider,
        typescript: typescriptProvider,
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        errorHandlerServiceSetup:
          errorHandlerServiceSetupProvider.export(projectScope),
      },
      run({
        loggerService,
        fastifyServer,
        typescript,
        configServiceImports,
        typescriptFile,
      }) {
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

            await typescriptFile.writeTemplateFile(builder, {
              template:
                CORE_ERROR_HANDLER_SERVICE_TS_TEMPLATES.errorHandlerPlugin,
              destination: 'src/plugins/error-handler.ts',
              variables: {},
              importMapProviders: {
                configService: configServiceImports,
              },
            });

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
              }),
            );

            await builder.apply(
              copyFileAction({
                source: 'utils/zod.ts',
                destination: 'src/utils/zod.ts',
              }),
            );
          },
        };
      },
    }),
    main: createGeneratorTask({
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
  }),
});
