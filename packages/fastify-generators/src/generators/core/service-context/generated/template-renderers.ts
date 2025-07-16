import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_SERVICE_CONTEXT_PATHS } from './template-paths.js';
import { CORE_SERVICE_CONTEXT_TEMPLATES } from './typed-templates.js';

export interface CoreServiceContextRenderers {
  serviceContext: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_SERVICE_CONTEXT_TEMPLATES.serviceContext
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  testHelper: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_SERVICE_CONTEXT_TEMPLATES.testHelper
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreServiceContextRenderers =
  createProviderType<CoreServiceContextRenderers>(
    'core-service-context-renderers',
  );

const coreServiceContextRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_SERVICE_CONTEXT_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    coreServiceContextRenderers: coreServiceContextRenderers.export(),
  },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreServiceContextRenderers: {
          serviceContext: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_SERVICE_CONTEXT_TEMPLATES.serviceContext,
                destination: paths.serviceContext,
                ...options,
              }),
          },
          testHelper: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_SERVICE_CONTEXT_TEMPLATES.testHelper,
                destination: paths.testHelper,
                generatorPaths: paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_SERVICE_CONTEXT_RENDERERS = {
  provider: coreServiceContextRenderers,
  task: coreServiceContextRenderersTask,
};
