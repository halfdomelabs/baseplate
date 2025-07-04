import type { BuilderAction } from '@baseplate-dev/sync';

import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import type { RenderTsTemplateFileActionInput } from '#src/renderers/typescript/actions/render-ts-template-file-action.js';

import { typescriptFileProvider } from '#src/generators/node/typescript/typescript.generator.js';

import { NODE_ESLINT_PATHS } from './template-paths.js';
import { NODE_ESLINT_TEMPLATES } from './typed-templates.js';

export interface NodeEslintRenderers {
  eslintConfig: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof NODE_ESLINT_TEMPLATES.eslintConfig
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const nodeEslintRenderers = createProviderType<NodeEslintRenderers>(
  'node-eslint-renderers',
);

const nodeEslintRenderersTask = createGeneratorTask({
  dependencies: {
    paths: NODE_ESLINT_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { nodeEslintRenderers: nodeEslintRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        nodeEslintRenderers: {
          eslintConfig: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: NODE_ESLINT_TEMPLATES.eslintConfig,
                destination: paths.eslintConfig,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const NODE_ESLINT_RENDERERS = {
  provider: nodeEslintRenderers,
  task: nodeEslintRenderersTask,
};
