import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_CONFIG_SERVICE_PATHS } from './template-paths.js';
import { CORE_CONFIG_SERVICE_TEMPLATES } from './typed-templates.js';

export interface CoreConfigServiceRenderers {
  config: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_CONFIG_SERVICE_TEMPLATES.config
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreConfigServiceRenderers =
  createProviderType<CoreConfigServiceRenderers>(
    'core-config-service-renderers',
  );

const coreConfigServiceRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_CONFIG_SERVICE_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreConfigServiceRenderers: coreConfigServiceRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreConfigServiceRenderers: {
          config: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_CONFIG_SERVICE_TEMPLATES.config,
                destination: paths.config,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_CONFIG_SERVICE_RENDERERS = {
  provider: coreConfigServiceRenderers,
  task: coreConfigServiceRenderersTask,
};
