import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  projectScope,
  TsCodeUtils,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { reactLoggerImportsProvider } from '../react-logger/index.js';
import { CORE_REACT_ERROR_GENERATED } from './generated/index.js';

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

export const reactErrorGenerator = createGenerator({
  name: 'core/react-error',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    paths: CORE_REACT_ERROR_GENERATED.paths.task,
    imports: CORE_REACT_ERROR_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactLoggerImports: reactLoggerImportsProvider,
        reactErrorConfigValues: reactErrorConfigValuesProvider,
        paths: CORE_REACT_ERROR_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        reactLoggerImports,
        reactErrorConfigValues: {
          errorFormatters,
          errorReporters,
          contextActions,
        },
        paths,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ERROR_GENERATED.templates.errorLogger,
                destination: paths.errorLogger,
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
                template: CORE_REACT_ERROR_GENERATED.templates.errorFormatter,
                destination: paths.errorFormatter,
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
