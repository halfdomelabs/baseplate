import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';

import { CORE_REQUEST_SERVICE_CONTEXT_PATHS } from './template-paths.js';
import { CORE_REQUEST_SERVICE_CONTEXT_TEMPLATES } from './typed-templates.js';

export interface CoreRequestServiceContextRenderers {
  requestServiceContext: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_REQUEST_SERVICE_CONTEXT_TEMPLATES.requestServiceContext
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreRequestServiceContextRenderers =
  createProviderType<CoreRequestServiceContextRenderers>(
    'core-request-service-context-renderers',
  );

const coreRequestServiceContextRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_REQUEST_SERVICE_CONTEXT_PATHS.provider,
    serviceContextImports: serviceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    coreRequestServiceContextRenderers:
      coreRequestServiceContextRenderers.export(),
  },
  run({ paths, serviceContextImports, typescriptFile }) {
    return {
      providers: {
        coreRequestServiceContextRenderers: {
          requestServiceContext: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  CORE_REQUEST_SERVICE_CONTEXT_TEMPLATES.requestServiceContext,
                destination: paths.requestServiceContext,
                importMapProviders: {
                  serviceContextImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_REQUEST_SERVICE_CONTEXT_RENDERERS = {
  provider: coreRequestServiceContextRenderers,
  task: coreRequestServiceContextRenderersTask,
};
