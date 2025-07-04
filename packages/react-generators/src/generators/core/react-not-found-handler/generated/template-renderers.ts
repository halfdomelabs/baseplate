import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

import { CORE_REACT_NOT_FOUND_HANDLER_PATHS } from './template-paths.js';
import { CORE_REACT_NOT_FOUND_HANDLER_TEMPLATES } from './typed-templates.js';

export interface CoreReactNotFoundHandlerRenderers {
  notFoundPage: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_NOT_FOUND_HANDLER_TEMPLATES.notFoundPage
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreReactNotFoundHandlerRenderers =
  createProviderType<CoreReactNotFoundHandlerRenderers>(
    'core-react-not-found-handler-renderers',
  );

const coreReactNotFoundHandlerRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_NOT_FOUND_HANDLER_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    coreReactNotFoundHandlerRenderers:
      coreReactNotFoundHandlerRenderers.export(),
  },
  run({ paths, reactComponentsImports, typescriptFile }) {
    return {
      providers: {
        coreReactNotFoundHandlerRenderers: {
          notFoundPage: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_NOT_FOUND_HANDLER_TEMPLATES.notFoundPage,
                destination: paths.notFoundPage,
                importMapProviders: {
                  reactComponentsImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_NOT_FOUND_HANDLER_RENDERERS = {
  provider: coreReactNotFoundHandlerRenderers,
  task: coreReactNotFoundHandlerRenderersTask,
};
