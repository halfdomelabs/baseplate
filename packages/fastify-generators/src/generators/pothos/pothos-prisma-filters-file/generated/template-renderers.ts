import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { pothosImportsProvider } from '#src/generators/pothos/pothos/generated/ts-import-providers.js';

import { POTHOS_POTHOS_PRISMA_FILTERS_FILE_PATHS } from './template-paths.js';
import { POTHOS_POTHOS_PRISMA_FILTERS_FILE_TEMPLATES } from './typed-templates.js';

export interface PothosPothosPrismaFiltersFileRenderers {
  mainGroupGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof POTHOS_POTHOS_PRISMA_FILTERS_FILE_TEMPLATES.mainGroupGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const pothosPothosPrismaFiltersFileRenderers =
  createProviderType<PothosPothosPrismaFiltersFileRenderers>(
    'pothos-pothos-prisma-filters-file-renderers',
  );

const pothosPothosPrismaFiltersFileRenderersTask = createGeneratorTask({
  dependencies: {
    paths: POTHOS_POTHOS_PRISMA_FILTERS_FILE_PATHS.provider,
    pothosImports: pothosImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    pothosPothosPrismaFiltersFileRenderers:
      pothosPothosPrismaFiltersFileRenderers.export(),
  },
  run({ paths, pothosImports, typescriptFile }) {
    return {
      providers: {
        pothosPothosPrismaFiltersFileRenderers: {
          mainGroupGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group:
                  POTHOS_POTHOS_PRISMA_FILTERS_FILE_TEMPLATES.mainGroupGroup,
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

export const POTHOS_POTHOS_PRISMA_FILTERS_FILE_RENDERERS = {
  provider: pothosPothosPrismaFiltersFileRenderers,
  task: pothosPothosPrismaFiltersFileRenderersTask,
};
