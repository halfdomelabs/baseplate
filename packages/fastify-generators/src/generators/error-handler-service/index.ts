import {
  createTypescriptTemplateConfig,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  copyFileAction,
} from '@baseplate/sync';
import * as yup from 'yup';
import { loggerServiceProvider } from '../logger-service';

const descriptorSchema = yup.object({});

const errorHandlerFileConfig = createTypescriptTemplateConfig({
  LOGGER_ACTIONS: { type: 'code-block' },
});

export interface ErrorHandlerServiceProvider {
  getHandlerFile(): TypescriptSourceFile<typeof errorHandlerFileConfig>;
  getErrorFunction(): TypescriptCodeExpression;
}

export const errorHandlerServiceProvider =
  createProviderType<ErrorHandlerServiceProvider>('error-handler-service');

const ErrorHandlerServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    loggerService: loggerServiceProvider,
  },
  exports: {
    errorHandlerService: errorHandlerServiceProvider,
  },
  createGenerator(descriptor, { loggerService }) {
    const errorLoggerFile = new TypescriptSourceFile(errorHandlerFileConfig);
    return {
      getProviders: () => ({
        errorHandlerService: {
          getHandlerFile: () => errorLoggerFile,
          getErrorFunction: () =>
            TypescriptCodeUtils.createExpression(
              'logError',
              "import { logError } from '@/src/services/error-logger'"
            ),
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
