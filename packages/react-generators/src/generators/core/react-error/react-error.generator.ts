import type {
  ImportMapper,
  TsCodeFragment,
} from '@halfdomelabs/core-generators';

import {
  projectScope,
  TsCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactLoggerImportsProvider } from '../react-logger/react-logger.generator.js';
import {
  createReactErrorImports,
  reactErrorImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_REACT_ERROR_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

const [setupTask, reactErrorConfigProvider, reactErrorConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      contextActions: t.map<string, TsCodeFragment>(),
      errorReporters: t.map<string, TsCodeFragment>(),
      errorFormatters: t.map<string, TsCodeFragment>(),
    }),
    {
      prefix: 'react-error',
      configScope: projectScope,
    },
  );

export { reactErrorConfigProvider };

export type ReactErrorProvider = ImportMapper;

export const reactErrorProvider = createProviderType<ReactErrorProvider>(
  'react-error',
  {
    isReadOnly: true,
  },
);

export const reactErrorGenerator = createGenerator({
  name: 'core/react-error',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactLoggerImports: reactLoggerImportsProvider,
        reactErrorConfigValues: reactErrorConfigValuesProvider,
      },
      exports: {
        reactError: reactErrorProvider.export(projectScope),
        reactErrorImports: reactErrorImportsProvider.export(projectScope),
      },
      run({
        typescriptFile,
        reactLoggerImports,
        reactErrorConfigValues: {
          errorFormatters,
          errorReporters,
          contextActions,
        },
      }) {
        return {
          providers: {
            reactError: {
              getImportMap: () => ({
                '%react-error/formatter': {
                  path: '@/src/services/error-formatter',
                  allowedImports: ['formatError', 'logAndFormatError'],
                },
                '%react-error/logger': {
                  path: '@/src/services/error-logger',
                  allowedImports: ['logError'],
                },
              }),
            },
            reactErrorImports: createReactErrorImports('@/src/services'),
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ERROR_TS_TEMPLATES.errorLogger,
                destination: '@/src/services/error-logger.ts',
                importMapProviders: {
                  reactLoggerImports,
                },
                variables: {
                  TPL_CONTEXT_ACTIONS:
                    TsCodeUtils.mergeFragments(contextActions),
                  TPL_LOGGER_ACTIONS:
                    TsCodeUtils.mergeFragments(errorReporters),
                },
              }),
            );
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ERROR_TS_TEMPLATES.errorFormatter,
                destination: '@/src/services/error-formatter.ts',
                variables: {
                  TPL_ERROR_FORMATTERS:
                    TsCodeUtils.mergeFragments(errorFormatters),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});

export { reactErrorImportsProvider } from './generated/ts-import-maps.js';
