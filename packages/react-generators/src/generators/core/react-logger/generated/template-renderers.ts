import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_REACT_LOGGER_PATHS } from './template-paths.js';
import { CORE_REACT_LOGGER_TEMPLATES } from './typed-templates.js';

export interface CoreReactLoggerRenderers {
  logger: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_LOGGER_TEMPLATES.logger
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreReactLoggerRenderers = createProviderType<CoreReactLoggerRenderers>(
  'core-react-logger-renderers',
);

const coreReactLoggerRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_LOGGER_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreReactLoggerRenderers: coreReactLoggerRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreReactLoggerRenderers: {
          logger: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_LOGGER_TEMPLATES.logger,
                destination: paths.logger,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_LOGGER_RENDERERS = {
  provider: coreReactLoggerRenderers,
  task: coreReactLoggerRenderersTask,
};
