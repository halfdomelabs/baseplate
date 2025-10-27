import type { BuilderAction } from '@baseplate-dev/sync';

import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import type { RenderTextTemplateFileActionInput } from '#src/renderers/text/render-text-template-file-action.js';

import { renderTextTemplateFileAction } from '#src/renderers/text/render-text-template-file-action.js';

import { NODE_ROOT_README_PATHS } from './template-paths.js';
import { NODE_ROOT_README_TEMPLATES } from './typed-templates.js';

export interface NodeRootReadmeRenderers {
  readme: {
    render: (
      options: Omit<
        RenderTextTemplateFileActionInput<
          typeof NODE_ROOT_README_TEMPLATES.readme
        >,
        'destination' | 'template'
      >,
    ) => BuilderAction;
  };
}

const nodeRootReadmeRenderers = createProviderType<NodeRootReadmeRenderers>(
  'node-root-readme-renderers',
);

const nodeRootReadmeRenderersTask = createGeneratorTask({
  dependencies: { paths: NODE_ROOT_README_PATHS.provider },
  exports: { nodeRootReadmeRenderers: nodeRootReadmeRenderers.export() },
  run({ paths }) {
    return {
      providers: {
        nodeRootReadmeRenderers: {
          readme: {
            render: (options) =>
              renderTextTemplateFileAction({
                template: NODE_ROOT_README_TEMPLATES.readme,
                destination: paths.readme,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const NODE_ROOT_README_RENDERERS = {
  provider: nodeRootReadmeRenderers,
  task: nodeRootReadmeRenderersTask,
};
