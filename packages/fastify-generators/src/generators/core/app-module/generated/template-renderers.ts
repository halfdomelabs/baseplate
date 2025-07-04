import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { appModuleSetupImportsProvider } from '#src/generators/core/app-module-setup/generated/ts-import-providers.js';

import { CORE_APP_MODULE_TEMPLATES } from './typed-templates.js';

export interface CoreAppModuleRenderers {
  index: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof CORE_APP_MODULE_TEMPLATES.index>,
        'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreAppModuleRenderers = createProviderType<CoreAppModuleRenderers>(
  'core-app-module-renderers',
);

const coreAppModuleRenderersTask = createGeneratorTask({
  dependencies: {
    appModuleSetupImports: appModuleSetupImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreAppModuleRenderers: coreAppModuleRenderers.export() },
  run({ appModuleSetupImports, typescriptFile }) {
    return {
      providers: {
        coreAppModuleRenderers: {
          index: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_APP_MODULE_TEMPLATES.index,
                importMapProviders: {
                  appModuleSetupImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_APP_MODULE_RENDERERS = {
  provider: coreAppModuleRenderers,
  task: coreAppModuleRenderersTask,
};
