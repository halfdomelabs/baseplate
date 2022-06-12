import {
  copyTypescriptFileAction,
  createTypescriptTemplateConfig,
  ImportMapper,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  copyFileAction,
} from '@baseplate/sync';
import { z } from 'zod';
import { fastifyServerProvider } from '../fastify-server';
import { loggerServiceProvider } from '../logger-service';

const descriptorSchema = z.object({});

const errorHandlerFileConfig = createTypescriptTemplateConfig({
  HEADER: { type: 'code-block' },
  LOGGER_ACTIONS: { type: 'code-block' },
});

const ERROR_MAP = {
  http: 'HttpError',
  badRequest: 'BadRequestError',
  unauthorized: 'UnauthorizedError',
  forbidden: 'ForbiddenError',
  notFound: 'NotFoundError',
};

export interface ErrorHandlerServiceProvider extends ImportMapper {
  getHandlerFile(): TypescriptSourceFile<typeof errorHandlerFileConfig>;
  getHttpErrorsImport(): string;
  getErrorFunction(): TypescriptCodeExpression;
  getHttpErrorExpression(
    error: keyof typeof ERROR_MAP
  ): TypescriptCodeExpression;
}

export const errorHandlerServiceProvider =
  createProviderType<ErrorHandlerServiceProvider>('error-handler-service');

const ErrorHandlerServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    loggerService: loggerServiceProvider,
    fastifyServer: fastifyServerProvider,
    typescript: typescriptProvider,
  },
  exports: {
    errorHandlerService: errorHandlerServiceProvider,
  },
  createGenerator(descriptor, { loggerService, fastifyServer, typescript }) {
    const errorLoggerFile = typescript.createTemplate(errorHandlerFileConfig);

    fastifyServer.registerPlugin({
      name: 'errorHandlerPlugin',
      plugin: TypescriptCodeUtils.createExpression(
        'errorHandlerPlugin',
        "import { errorHandlerPlugin } from '@/src/plugins/error-handler'"
      ),
    });

    const errorFunction = TypescriptCodeUtils.createExpression(
      'logError',
      "import { logError } from '@/src/services/error-logger'"
    );

    fastifyServer.getConfig().set('errorHandlerFunction', errorFunction);

    return {
      getProviders: () => ({
        errorHandlerService: {
          getHandlerFile: () => errorLoggerFile,
          getErrorFunction: () => errorFunction,
          getHttpErrorsImport: () => '@/src/utils/http-errors',
          getHttpErrorExpression: (error) =>
            new TypescriptCodeExpression(
              ERROR_MAP[error],
              `import { ${ERROR_MAP[error]} } from '@/src/utils/http-errors'`
            ),
          getImportMap: () => ({
            '%http-errors': {
              path: `@/src/utils/http-errors`,
              allowedImports: Object.values(ERROR_MAP),
            },
            '%error-logger': {
              path: '@/src/services/error-logger',
              allowedImports: ['logError'],
            },
          }),
        },
      }),
      build: async (builder) => {
        errorLoggerFile.addCodeBlock(
          'LOGGER_ACTIONS',
          TypescriptCodeUtils.toBlock(
            TypescriptCodeUtils.wrapExpression(
              loggerService.getLogger(),
              (code) => `${code}.error(error);`
            )
          )
        );

        await builder.apply(
          copyTypescriptFileAction({
            source: 'plugins/error-handler.ts',
            destination: 'src/plugins/error-handler.ts',
          })
        );

        await builder.apply(
          errorLoggerFile.renderToAction(
            'services/error-logger.ts',
            'src/services/error-logger.ts'
          )
        );

        await builder.apply(
          copyFileAction({
            source: 'utils/http-errors.ts',
            destination: 'src/utils/http-errors.ts',
            shouldFormat: true,
          })
        );
      },
    };
  },
});

export default ErrorHandlerServiceGenerator;
