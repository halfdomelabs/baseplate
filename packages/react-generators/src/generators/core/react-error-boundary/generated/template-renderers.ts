import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

import { CORE_REACT_ERROR_BOUNDARY_PATHS } from './template-paths.js';
import { CORE_REACT_ERROR_BOUNDARY_TEMPLATES } from './typed-templates.js';

export interface CoreReactErrorBoundaryRenderers {
  component: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ERROR_BOUNDARY_TEMPLATES.component
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreReactErrorBoundaryRenderers =
  createProviderType<CoreReactErrorBoundaryRenderers>(
    'core-react-error-boundary-renderers',
  );

const coreReactErrorBoundaryRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_ERROR_BOUNDARY_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    coreReactErrorBoundaryRenderers: coreReactErrorBoundaryRenderers.export(),
  },
  run({ paths, reactComponentsImports, reactErrorImports, typescriptFile }) {
    return {
      providers: {
        coreReactErrorBoundaryRenderers: {
          component: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ERROR_BOUNDARY_TEMPLATES.component,
                destination: paths.component,
                importMapProviders: {
                  reactComponentsImports,
                  reactErrorImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_ERROR_BOUNDARY_RENDERERS = {
  provider: coreReactErrorBoundaryRenderers,
  task: coreReactErrorBoundaryRenderersTask,
};
