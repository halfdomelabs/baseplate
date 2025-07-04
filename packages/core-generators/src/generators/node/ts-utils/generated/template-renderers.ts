import type { BuilderAction } from '@baseplate-dev/sync';

import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import type { RenderTsTemplateFileActionInput } from '#src/renderers/typescript/actions/render-ts-template-file-action.js';

import { typescriptFileProvider } from '#src/generators/node/typescript/typescript.generator.js';

import { NODE_TS_UTILS_PATHS } from './template-paths.js';
import { NODE_TS_UTILS_TEMPLATES } from './typed-templates.js';

export interface NodeTsUtilsRenderers {
  arrays: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof NODE_TS_UTILS_TEMPLATES.arrays>,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  normalizeTypes: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof NODE_TS_UTILS_TEMPLATES.normalizeTypes
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  nulls: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof NODE_TS_UTILS_TEMPLATES.nulls>,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  string: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof NODE_TS_UTILS_TEMPLATES.string>,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const nodeTsUtilsRenderers = createProviderType<NodeTsUtilsRenderers>(
  'node-ts-utils-renderers',
);

const nodeTsUtilsRenderersTask = createGeneratorTask({
  dependencies: {
    paths: NODE_TS_UTILS_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { nodeTsUtilsRenderers: nodeTsUtilsRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        nodeTsUtilsRenderers: {
          arrays: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: NODE_TS_UTILS_TEMPLATES.arrays,
                destination: paths.arrays,
                ...options,
              }),
          },
          normalizeTypes: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: NODE_TS_UTILS_TEMPLATES.normalizeTypes,
                destination: paths.normalizeTypes,
                ...options,
              }),
          },
          nulls: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: NODE_TS_UTILS_TEMPLATES.nulls,
                destination: paths.nulls,
                ...options,
              }),
          },
          string: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: NODE_TS_UTILS_TEMPLATES.string,
                destination: paths.string,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const NODE_TS_UTILS_RENDERERS = {
  provider: nodeTsUtilsRenderers,
  task: nodeTsUtilsRenderersTask,
};
