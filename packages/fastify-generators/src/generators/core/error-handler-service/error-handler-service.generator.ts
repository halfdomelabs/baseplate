import type {
  ImportMapper,
  TsCodeFragment,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';

import {
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  TypescriptCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { configServiceImportsProvider } from '../config-service/config-service.generator.js';
import { fastifyServerProvider } from '../fastify-server/index.js';
import { loggerServiceImportsProvider } from '../logger-service/logger-service.generator.js';
import {
  createErrorHandlerServiceImports,
  errorHandlerServiceImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_ERROR_HANDLER_SERVICE_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

const ERROR_MAP = {
  http: 'HttpError',
  badRequest: 'BadRequestError',
  unauthorized: 'UnauthorizedError',
  forbidden: 'ForbiddenError',
  notFound: 'NotFoundError',
};

export const [
  configTask,
  errorHandlerServiceConfigProvider,
  errorHandlerServiceConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    contextActions: t.array<TsCodeFragment>(),
    loggerActions: t.array<TsCodeFragment>(),
  }),
  {
    prefix: 'error-handler-service',
    configScope: projectScope,
  },
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
    imports: createGeneratorTask({
      exports: {
        errorHandlerServiceImports:
          errorHandlerServiceImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            errorHandlerServiceImports:
              createErrorHandlerServiceImports('@/src'),
          },
        };
      },
    }),
    fastifyPlugin: createGeneratorTask({
      dependencies: {
        fastifyServer: fastifyServerProvider,
        typescriptFile: typescriptFileProvider,
        configServiceImports: configServiceImportsProvider,
      },
      run({ fastifyServer, typescriptFile, configServiceImports }) {
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
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  CORE_ERROR_HANDLER_SERVICE_TS_TEMPLATES.errorHandlerPlugin,
                destination: 'src/plugins/error-handler.ts',
                variables: {},
                importMapProviders: {
                  configServiceImports,
                },
              }),
            );
          },
        };
      },
    }),
    configTask,
    errorLogger: createGeneratorTask({
      dependencies: {
        loggerServiceImports: loggerServiceImportsProvider,
        typescriptFile: typescriptFileProvider,
        errorHandlerServiceConfigValues:
          errorHandlerServiceConfigValuesProvider,
      },
      run({
        loggerServiceImports,
        typescriptFile,
        errorHandlerServiceConfigValues: { contextActions, loggerActions },
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_ERROR_HANDLER_SERVICE_TS_TEMPLATES.errorLogger,
                destination: 'src/services/error-logger.ts',
                variables: {
                  TPL_CONTEXT_ACTIONS:
                    TsCodeUtils.mergeFragments(contextActions),
                  TPL_LOGGER_ACTIONS: TsCodeUtils.mergeFragments([
                    ...loggerActions,
                    tsCodeFragment(
                      `logger.error({ err: error, ...context });`,
                      loggerServiceImports.importMap.logger.declaration(),
                    ),
                  ]),
                },
              }),
            );
          },
        };
      },
    }),
    utils: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
      },
      run({ typescriptFile }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: CORE_ERROR_HANDLER_SERVICE_TS_TEMPLATES.utilsGroup,
                baseDirectory: 'src/utils',
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
