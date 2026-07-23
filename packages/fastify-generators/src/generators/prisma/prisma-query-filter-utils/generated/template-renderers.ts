import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { dataUtilsImportsProvider } from '#src/generators/prisma/data-utils/generated/ts-import-providers.js';

import { PRISMA_PRISMA_QUERY_FILTER_UTILS_PATHS } from './template-paths.js';
import { PRISMA_PRISMA_QUERY_FILTER_UTILS_TEMPLATES } from './typed-templates.js';

export interface PrismaPrismaQueryFilterUtilsRenderers {
  mainGroupGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof PRISMA_PRISMA_QUERY_FILTER_UTILS_TEMPLATES.mainGroupGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const prismaPrismaQueryFilterUtilsRenderers =
  createProviderType<PrismaPrismaQueryFilterUtilsRenderers>(
    'prisma-prisma-query-filter-utils-renderers',
  );

const prismaPrismaQueryFilterUtilsRenderersTask = createGeneratorTask({
  dependencies: {
    dataUtilsImports: dataUtilsImportsProvider,
    paths: PRISMA_PRISMA_QUERY_FILTER_UTILS_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    prismaPrismaQueryFilterUtilsRenderers:
      prismaPrismaQueryFilterUtilsRenderers.export(),
  },
  run({ dataUtilsImports, paths, typescriptFile }) {
    return {
      providers: {
        prismaPrismaQueryFilterUtilsRenderers: {
          mainGroupGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group:
                  PRISMA_PRISMA_QUERY_FILTER_UTILS_TEMPLATES.mainGroupGroup,
                paths,
                importMapProviders: {
                  dataUtilsImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const PRISMA_PRISMA_QUERY_FILTER_UTILS_RENDERERS = {
  provider: prismaPrismaQueryFilterUtilsRenderers,
  task: prismaPrismaQueryFilterUtilsRenderersTask,
};
