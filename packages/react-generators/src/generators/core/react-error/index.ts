import {
  ImportMapper,
  makeImportAndFilePath,
  TypescriptCodeBlock,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { reactLoggerProvider } from '../react-logger';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export interface ReactErrorProvider extends ImportMapper {
  addErrorReporter(reporter: TypescriptCodeBlock): void;
  addErrorFormatter(formatter: TypescriptCodeBlock): void;
}

export const reactErrorProvider =
  createProviderType<ReactErrorProvider>('react-error');

const ReactErrorGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    reactLogger: reactLoggerProvider,
  },
  exports: {
    reactError: reactErrorProvider,
  },
  createGenerator(descriptor, { typescript, reactLogger }) {
    const loggerFile = typescript.createTemplate(
      {
        ERROR_REPORTERS: {
          type: 'code-block',
          default: '// no error reporters registered',
        },
      },
      { importMappers: [reactLogger] }
    );
    const [loggerImport, loggerPath] = makeImportAndFilePath(
      'src/services/error-logger.ts'
    );

    const formatterFile = typescript.createTemplate({
      ERROR_FORMATTERS: { type: 'code-block' },
    });
    const [formatterImport, formatterPath] = makeImportAndFilePath(
      'src/services/error-formatter.ts'
    );

    return {
      getProviders: () => ({
        reactError: {
          addErrorReporter(reporter) {
            loggerFile.addCodeBlock('ERROR_REPORTERS', reporter);
          },
          addErrorFormatter(formatter) {
            formatterFile.addCodeBlock('ERROR_FORMATTERS', formatter);
          },
          getImportMap: () => ({
            '%react-error/formatter': {
              path: formatterImport,
              allowedImports: ['formatError', 'logAndFormatError'],
            },
            '%react-error/logger': {
              path: loggerImport,
              allowedImports: ['logError'],
            },
          }),
        },
      }),
      build: async (builder) => {
        await builder.apply(
          loggerFile.renderToAction('services/error-logger.ts', loggerPath)
        );
        await builder.apply(
          formatterFile.renderToAction(
            'services/error-formatter.ts',
            formatterPath
          )
        );
      },
    };
  },
});

export default ReactErrorGenerator;
