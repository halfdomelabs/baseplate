import type { BuilderAction } from '@baseplate-dev/sync';

import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import type { RenderTsTemplateFileActionInput } from '#src/renderers/typescript/actions/render-ts-template-file-action.js';

import { typescriptFileProvider } from '#src/generators/node/typescript/typescript.generator.js';

import { NODE_VITEST_PATHS } from './template-paths.js';
import { NODE_VITEST_TEMPLATES } from './typed-templates.js';

export interface NodeVitestRenderers {
  globalSetup: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof NODE_VITEST_TEMPLATES.globalSetup
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  vitestConfig: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof NODE_VITEST_TEMPLATES.vitestConfig
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const nodeVitestRenderers = createProviderType<NodeVitestRenderers>(
  'node-vitest-renderers',
);

const nodeVitestRenderersTask = createGeneratorTask({
  dependencies: {
    paths: NODE_VITEST_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { nodeVitestRenderers: nodeVitestRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        nodeVitestRenderers: {
          globalSetup: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: NODE_VITEST_TEMPLATES.globalSetup,
                destination: paths.globalSetup,
                ...options,
              }),
          },
          vitestConfig: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: NODE_VITEST_TEMPLATES.vitestConfig,
                destination: paths.vitestConfig,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const NODE_VITEST_RENDERERS = {
  provider: nodeVitestRenderers,
  task: nodeVitestRenderersTask,
};
