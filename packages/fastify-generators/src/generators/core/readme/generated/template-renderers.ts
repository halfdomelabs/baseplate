import type { RenderTextTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { renderTextTemplateFileAction } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { CORE_README_PATHS } from './template-paths.js';
import { CORE_README_TEMPLATES } from './typed-templates.js';

export interface CoreReadmeRenderers {
  readme: {
    render: (
      options: Omit<
        RenderTextTemplateFileActionInput<typeof CORE_README_TEMPLATES.readme>,
        'destination' | 'template'
      >,
    ) => BuilderAction;
  };
}

const coreReadmeRenderers = createProviderType<CoreReadmeRenderers>(
  'core-readme-renderers',
);

const coreReadmeRenderersTask = createGeneratorTask({
  dependencies: { paths: CORE_README_PATHS.provider },
  exports: { coreReadmeRenderers: coreReadmeRenderers.export() },
  run({ paths }) {
    return {
      providers: {
        coreReadmeRenderers: {
          readme: {
            render: (options) =>
              renderTextTemplateFileAction({
                template: CORE_README_TEMPLATES.readme,
                destination: paths.readme,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const CORE_README_RENDERERS = {
  provider: coreReadmeRenderers,
  task: coreReadmeRenderersTask,
};
