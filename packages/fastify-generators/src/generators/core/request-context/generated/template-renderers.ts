import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_REQUEST_CONTEXT_PATHS } from './template-paths.js';
import { CORE_REQUEST_CONTEXT_TEMPLATES } from './typed-templates.js';

export interface CoreRequestContextRenderers {
  requestContext: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REQUEST_CONTEXT_TEMPLATES.requestContext
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreRequestContextRenderers =
  createProviderType<CoreRequestContextRenderers>(
    'core-request-context-renderers',
  );

const coreRequestContextRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REQUEST_CONTEXT_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    coreRequestContextRenderers: coreRequestContextRenderers.export(),
  },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreRequestContextRenderers: {
          requestContext: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_REQUEST_CONTEXT_TEMPLATES.requestContext,
                destination: paths.requestContext,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REQUEST_CONTEXT_RENDERERS = {
  provider: coreRequestContextRenderers,
  task: coreRequestContextRenderersTask,
};
