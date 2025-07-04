import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_REACT_PATHS } from './template-paths.js';
import { CORE_REACT_TEMPLATES } from './typed-templates.js';

export interface CoreReactRenderers {
  index: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof CORE_REACT_TEMPLATES.index>,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  viteConfig: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof CORE_REACT_TEMPLATES.viteConfig>,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreReactRenderers = createProviderType<CoreReactRenderers>(
  'core-react-renderers',
);

const coreReactRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreReactRenderers: coreReactRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreReactRenderers: {
          index: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_TEMPLATES.index,
                destination: paths.index,
                ...options,
              }),
          },
          viteConfig: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_TEMPLATES.viteConfig,
                destination: paths.viteConfig,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_RENDERERS = {
  provider: coreReactRenderers,
  task: coreReactRenderersTask,
};
