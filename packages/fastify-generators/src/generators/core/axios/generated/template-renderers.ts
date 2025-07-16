import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_AXIOS_PATHS } from './template-paths.js';
import { CORE_AXIOS_TEMPLATES } from './typed-templates.js';

export interface CoreAxiosRenderers {
  axios: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof CORE_AXIOS_TEMPLATES.axios>,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreAxiosRenderers = createProviderType<CoreAxiosRenderers>(
  'core-axios-renderers',
);

const coreAxiosRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_AXIOS_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { coreAxiosRenderers: coreAxiosRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreAxiosRenderers: {
          axios: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_AXIOS_TEMPLATES.axios,
                destination: paths.axios,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_AXIOS_RENDERERS = {
  provider: coreAxiosRenderers,
  task: coreAxiosRenderersTask,
};
