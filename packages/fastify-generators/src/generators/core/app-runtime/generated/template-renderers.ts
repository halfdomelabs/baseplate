import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_APP_RUNTIME_PATHS } from './template-paths.js';
import { CORE_APP_RUNTIME_TEMPLATES } from './typed-templates.js';

export interface CoreAppRuntimeRenderers {
  appRuntime: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_APP_RUNTIME_TEMPLATES.appRuntime
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  runtimeServices: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_APP_RUNTIME_TEMPLATES.runtimeServices
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreAppRuntimeRenderers = createProviderType<CoreAppRuntimeRenderers>(
  'core-app-runtime-renderers',
);

const coreAppRuntimeRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_APP_RUNTIME_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreAppRuntimeRenderers: coreAppRuntimeRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreAppRuntimeRenderers: {
          appRuntime: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_APP_RUNTIME_TEMPLATES.appRuntime,
                destination: paths.appRuntime,
                generatorPaths: paths,
                ...options,
              }),
          },
          runtimeServices: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_APP_RUNTIME_TEMPLATES.runtimeServices,
                destination: paths.runtimeServices,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_APP_RUNTIME_RENDERERS = {
  provider: coreAppRuntimeRenderers,
  task: coreAppRuntimeRenderersTask,
};
