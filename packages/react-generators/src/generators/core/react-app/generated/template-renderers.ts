import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_REACT_APP_PATHS } from './template-paths.js';
import { CORE_REACT_APP_TEMPLATES } from './typed-templates.js';

export interface CoreReactAppRenderers {
  app: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof CORE_REACT_APP_TEMPLATES.app>,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreReactAppRenderers = createProviderType<CoreReactAppRenderers>(
  'core-react-app-renderers',
);

const coreReactAppRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REACT_APP_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreReactAppRenderers: coreReactAppRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreReactAppRenderers: {
          app: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_APP_TEMPLATES.app,
                destination: paths.app,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REACT_APP_RENDERERS = {
  provider: coreReactAppRenderers,
  task: coreReactAppRenderersTask,
};
