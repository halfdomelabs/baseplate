import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { pothosImportsProvider } from '#src/generators/pothos/pothos/generated/ts-import-providers.js';

import { POTHOS_POTHOS_SORT_ORDER_PATHS } from './template-paths.js';
import { POTHOS_POTHOS_SORT_ORDER_TEMPLATES } from './typed-templates.js';

export interface PothosPothosSortOrderRenderers {
  mainGroupGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof POTHOS_POTHOS_SORT_ORDER_TEMPLATES.mainGroupGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const pothosPothosSortOrderRenderers =
  createProviderType<PothosPothosSortOrderRenderers>(
    'pothos-pothos-sort-order-renderers',
  );

const pothosPothosSortOrderRenderersTask = createGeneratorTask({
  dependencies: {
    paths: POTHOS_POTHOS_SORT_ORDER_PATHS.provider,
    pothosImports: pothosImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    pothosPothosSortOrderRenderers: pothosPothosSortOrderRenderers.export(),
  },
  run({ paths, pothosImports, typescriptFile }) {
    return {
      providers: {
        pothosPothosSortOrderRenderers: {
          mainGroupGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: POTHOS_POTHOS_SORT_ORDER_TEMPLATES.mainGroupGroup,
                paths,
                importMapProviders: {
                  pothosImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const POTHOS_POTHOS_SORT_ORDER_RENDERERS = {
  provider: pothosPothosSortOrderRenderers,
  task: pothosPothosSortOrderRenderersTask,
};
