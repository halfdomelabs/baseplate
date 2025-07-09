import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_REACT_UTILS_PATHS } from './template-paths.js';
import { CORE_REACT_UTILS_TEMPLATES } from './typed-templates.js';

export interface CoreReactUtilsRenderers {
  safeLocalStorage: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_UTILS_TEMPLATES.safeLocalStorage
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreReactUtilsRenderers = createProviderType<CoreReactUtilsRenderers>(
  'core-react-utils-renderers',
);

const coreReactUtilsRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_UTILS_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreReactUtilsRenderers: coreReactUtilsRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreReactUtilsRenderers: {
          safeLocalStorage: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_UTILS_TEMPLATES.safeLocalStorage,
                destination: paths.safeLocalStorage,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_UTILS_RENDERERS = {
  provider: coreReactUtilsRenderers,
  task: coreReactUtilsRenderersTask,
};
