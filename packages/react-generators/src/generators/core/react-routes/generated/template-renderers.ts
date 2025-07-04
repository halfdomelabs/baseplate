import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_REACT_ROUTES_TEMPLATES } from './typed-templates.js';

export interface CoreReactRoutesRenderers {
  index: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_ROUTES_TEMPLATES.index
        >,
        'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreReactRoutesRenderers = createProviderType<CoreReactRoutesRenderers>(
  'core-react-routes-renderers',
);

const coreReactRoutesRenderersTask = createGeneratorTask({
  dependencies: { typescriptFile: typescriptFileProvider },
  exports: { coreReactRoutesRenderers: coreReactRoutesRenderers.export() },
  run({ typescriptFile }) {
    return {
      providers: {
        coreReactRoutesRenderers: {
          index: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_ROUTES_TEMPLATES.index,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_ROUTES_RENDERERS = {
  provider: coreReactRoutesRenderers,
  task: coreReactRoutesRenderersTask,
};
