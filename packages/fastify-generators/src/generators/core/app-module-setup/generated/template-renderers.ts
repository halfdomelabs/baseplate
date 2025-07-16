import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_APP_MODULE_SETUP_PATHS } from './template-paths.js';
import { CORE_APP_MODULE_SETUP_TEMPLATES } from './typed-templates.js';

export interface CoreAppModuleSetupRenderers {
  appModules: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_APP_MODULE_SETUP_TEMPLATES.appModules
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreAppModuleSetupRenderers =
  createProviderType<CoreAppModuleSetupRenderers>(
    'core-app-module-setup-renderers',
  );

const coreAppModuleSetupRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_APP_MODULE_SETUP_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    coreAppModuleSetupRenderers: coreAppModuleSetupRenderers.export(),
  },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreAppModuleSetupRenderers: {
          appModules: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_APP_MODULE_SETUP_TEMPLATES.appModules,
                destination: paths.appModules,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_APP_MODULE_SETUP_RENDERERS = {
  provider: coreAppModuleSetupRenderers,
  task: coreAppModuleSetupRenderersTask,
};
