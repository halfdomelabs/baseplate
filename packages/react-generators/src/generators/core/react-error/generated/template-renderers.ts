import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactLoggerImportsProvider } from '#src/generators/core/react-logger/generated/ts-import-providers.js';

import { CORE_REACT_ERROR_PATHS } from './template-paths.js';
import { CORE_REACT_ERROR_TEMPLATES } from './typed-templates.js';

export interface CoreReactErrorRenderers {
  errorFormatter: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ERROR_TEMPLATES.errorFormatter
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  errorLogger: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ERROR_TEMPLATES.errorLogger
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreReactErrorRenderers = createProviderType<CoreReactErrorRenderers>(
  'core-react-error-renderers',
);

const coreReactErrorRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_ERROR_PATHS.provider,
    reactLoggerImports: reactLoggerImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreReactErrorRenderers: coreReactErrorRenderers.export() },
  run({ paths, reactLoggerImports, typescriptFile }) {
    return {
      providers: {
        coreReactErrorRenderers: {
          errorFormatter: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ERROR_TEMPLATES.errorFormatter,
                destination: paths.errorFormatter,
                ...options,
              }),
          },
          errorLogger: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ERROR_TEMPLATES.errorLogger,
                destination: paths.errorLogger,
                importMapProviders: {
                  reactLoggerImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_ERROR_RENDERERS = {
  provider: coreReactErrorRenderers,
  task: coreReactErrorRenderersTask,
};
