import type { RenderRawTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { renderRawTemplateFileAction } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_FASTIFY_SCRIPTS_PATHS } from './template-paths.js';
import { CORE_FASTIFY_SCRIPTS_TEMPLATES } from './typed-templates.js';

export interface CoreFastifyScriptsRenderers {
  tsconfig: {
    render: (
      options: Omit<
        RenderRawTemplateFileActionInput<
          typeof CORE_FASTIFY_SCRIPTS_TEMPLATES.tsconfig
        >,
        'destination' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreFastifyScriptsRenderers =
  createProviderType<CoreFastifyScriptsRenderers>(
    'core-fastify-scripts-renderers',
  );

const coreFastifyScriptsRenderersTask = createGeneratorTask({
  dependencies: { paths: CORE_FASTIFY_SCRIPTS_PATHS.provider },
  exports: {
    coreFastifyScriptsRenderers: coreFastifyScriptsRenderers.export(),
  },
  run({ paths }) {
    return {
      providers: {
        coreFastifyScriptsRenderers: {
          tsconfig: {
            render: (options) =>
              renderRawTemplateFileAction({
                template: CORE_FASTIFY_SCRIPTS_TEMPLATES.tsconfig,
                destination: paths.tsconfig,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_FASTIFY_SCRIPTS_RENDERERS = {
  provider: coreFastifyScriptsRenderers,
  task: coreFastifyScriptsRenderersTask,
};
