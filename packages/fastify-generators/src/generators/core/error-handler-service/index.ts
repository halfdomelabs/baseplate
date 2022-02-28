import {
  copyTypescriptFileAction,
  createTypescriptTemplateConfig,
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
import * as yup from 'yup';
import { fastifyServerProvider } from '../fastify-server';
import { loggerServiceProvider } from '../logger-service';

const descriptorSchema = yup.object({});

const errorHandlerFileConfig = createTypescriptTemplateConfig({
  HEADER: { type: 'code-block' },
  LOGGER_ACTIONS: { type: 'code-block' },
});

export interface ErrorHandlerServiceProvider {
  getHandlerFile(): TypescriptSourceFile<typeof errorHandlerFileConfig>;
  getHttpErrorsImport(): string;
  getErrorFunction(): TypescriptCodeExpression;
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
