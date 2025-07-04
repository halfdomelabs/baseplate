import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_REACT_CONFIG_PATHS } from './template-paths.js';
import { CORE_REACT_CONFIG_TEMPLATES } from './typed-templates.js';

export interface CoreReactConfigRenderers {
  config: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REACT_CONFIG_TEMPLATES.config
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreReactConfigRenderers = createProviderType<CoreReactConfigRenderers>(
  'core-react-config-renderers',
);

const coreReactConfigRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_CONFIG_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreReactConfigRenderers: coreReactConfigRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreReactConfigRenderers: {
          config: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_CONFIG_TEMPLATES.config,
                destination: paths.config,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_CONFIG_RENDERERS = {
  provider: coreReactConfigRenderers,
  task: coreReactConfigRenderersTask,
};
