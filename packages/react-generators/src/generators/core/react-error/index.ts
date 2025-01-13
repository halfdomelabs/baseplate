import type {
  ImportMapper,
  TypescriptCodeBlock,
} from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  projectScope,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactLoggerProvider } from '../react-logger/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export interface ReactErrorProvider extends ImportMapper {
  addContextAction(action: TypescriptCodeBlock): void;
  addErrorReporter(reporter: TypescriptCodeBlock): void;
  addErrorFormatter(formatter: TypescriptCodeBlock): void;
}

export const reactErrorProvider =
  createProviderType<ReactErrorProvider>('react-error');

const ReactErrorGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        typescript: typescriptProvider,
        reactLogger: reactLoggerProvider,
      },
      exports: {
        reactError: reactErrorProvider.export(projectScope),
      },
      run({ typescript, reactLogger }) {
        const loggerFile = typescript.createTemplate(
          {
            CONTEXT_ACTIONS: {
              type: 'code-block',
            },
            LOGGER_ACTIONS: {
              type: 'code-block',
              default: '// no error reporters registered',
            },
          },
          { importMappers: [reactLogger] },
        );
        const [loggerImport, loggerPath] = makeImportAndFilePath(
          'src/services/error-logger.ts',
        );

        const formatterFile = typescript.createTemplate({
          ERROR_FORMATTERS: { type: 'code-block' },
        });
        const [formatterImport, formatterPath] = makeImportAndFilePath(
          'src/services/error-formatter.ts',
        );

        return {
          getProviders: () => ({
            reactError: {
              addContextAction(action) {
                loggerFile.addCodeBlock('CONTEXT_ACTIONS', action);
              },
              addErrorReporter(reporter) {
                loggerFile.addCodeBlock('LOGGER_ACTIONS', reporter);
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
              loggerFile.renderToAction('services/error-logger.ts', loggerPath),
            );
            await builder.apply(
              formatterFile.renderToAction(
                'services/error-formatter.ts',
                formatterPath,
              ),
            );
          },
        };
      },
    });
  },
});

export default ReactErrorGenerator;
