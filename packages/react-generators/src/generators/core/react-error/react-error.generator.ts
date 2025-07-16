import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  TsCodeUtils,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

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
      configScope: packageScope,
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
    renderers: CORE_REACT_ERROR_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        reactErrorConfigValues: reactErrorConfigValuesProvider,
        renderers: CORE_REACT_ERROR_GENERATED.renderers.provider,
      },
      run({
        reactErrorConfigValues: {
          errorFormatters,
          errorReporters,
          contextActions,
        },
        renderers,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.errorLogger.render({
                variables: {
                  TPL_CONTEXT_ACTIONS:
                    TsCodeUtils.mergeFragments(contextActions),
                  TPL_LOGGER_ACTIONS:
                    TsCodeUtils.mergeFragments(errorReporters),
                },
              }),
            );
            const getFormattedErrorSuffix = tsTemplate`
              ${errorFormatters.size === 0 ? '// eslint-disable-next-line @typescript-eslint/no-unused-vars' : ''}
              function getFormattedErrorSuffix(${errorFormatters.size > 0 ? 'error' : '_error'}: unknown): string {
                ${TsCodeUtils.mergeFragments(errorFormatters)};

                return 'Please try again later.';
              }
                  `;
            await builder.apply(
              renderers.errorFormatter.render({
                variables: {
                  TPL_GET_FORMATTED_ERROR_SUFFIX: getFormattedErrorSuffix,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
