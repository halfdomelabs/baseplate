import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import {
  tsUtilsImportsProvider,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { POTHOS_POTHOS_PATHS } from './template-paths.js';
import { POTHOS_POTHOS_TEMPLATES } from './typed-templates.js';

export interface PothosPothosRenderers {
  builder: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof POTHOS_POTHOS_TEMPLATES.builder>,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  fieldWithInputPayloadGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof POTHOS_POTHOS_TEMPLATES.fieldWithInputPayloadGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  stripQueryMutationPlugin: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof POTHOS_POTHOS_TEMPLATES.stripQueryMutationPlugin
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const pothosPothosRenderers = createProviderType<PothosPothosRenderers>(
  'pothos-pothos-renderers',
);

const pothosPothosRenderersTask = createGeneratorTask({
  dependencies: {
    paths: POTHOS_POTHOS_PATHS.provider,
    tsUtilsImports: tsUtilsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { pothosPothosRenderers: pothosPothosRenderers.export() },
  run({ paths, tsUtilsImports, typescriptFile }) {
    return {
      providers: {
        pothosPothosRenderers: {
          builder: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_TEMPLATES.builder,
                destination: paths.builder,
                ...options,
              }),
          },
          fieldWithInputPayloadGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: POTHOS_POTHOS_TEMPLATES.fieldWithInputPayloadGroup,
                paths,
                importMapProviders: {
                  tsUtilsImports,
                },
                ...options,
              }),
          },
          stripQueryMutationPlugin: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_TEMPLATES.stripQueryMutationPlugin,
                destination: paths.stripQueryMutationPlugin,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const POTHOS_POTHOS_RENDERERS = {
  provider: pothosPothosRenderers,
  task: pothosPothosRenderersTask,
};
