import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_REACT_ROUTER_PATHS } from './template-paths.js';
import { CORE_REACT_ROUTER_TEMPLATES } from './typed-templates.js';

export interface CoreReactRouterRenderers {
  index: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ROUTER_TEMPLATES.index
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreReactRouterRenderers = createProviderType<CoreReactRouterRenderers>(
  'core-react-router-renderers',
);

const coreReactRouterRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_ROUTER_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreReactRouterRenderers: coreReactRouterRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreReactRouterRenderers: {
          index: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ROUTER_TEMPLATES.index,
                destination: paths.index,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_ROUTER_RENDERERS = {
  provider: coreReactRouterRenderers,
  task: coreReactRouterRenderersTask,
};
