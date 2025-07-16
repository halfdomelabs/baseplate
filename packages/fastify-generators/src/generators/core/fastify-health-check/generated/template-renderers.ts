import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_FASTIFY_HEALTH_CHECK_PATHS } from './template-paths.js';
import { CORE_FASTIFY_HEALTH_CHECK_TEMPLATES } from './typed-templates.js';

export interface CoreFastifyHealthCheckRenderers {
  healthCheck: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof CORE_FASTIFY_HEALTH_CHECK_TEMPLATES.healthCheck
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const coreFastifyHealthCheckRenderers =
  createProviderType<CoreFastifyHealthCheckRenderers>(
    'core-fastify-health-check-renderers',
  );

const coreFastifyHealthCheckRenderersTask = createGeneratorTask({
  dependencies: {
    paths: CORE_FASTIFY_HEALTH_CHECK_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    coreFastifyHealthCheckRenderers: coreFastifyHealthCheckRenderers.export(),
  },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        coreFastifyHealthCheckRenderers: {
          healthCheck: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: CORE_FASTIFY_HEALTH_CHECK_TEMPLATES.healthCheck,
                destination: paths.healthCheck,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_FASTIFY_HEALTH_CHECK_RENDERERS = {
  provider: coreFastifyHealthCheckRenderers,
  task: coreFastifyHealthCheckRenderersTask,
};
