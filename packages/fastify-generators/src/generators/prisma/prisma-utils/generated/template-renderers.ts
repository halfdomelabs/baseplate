import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import {
  tsUtilsImportsProvider,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { prismaGeneratedImportsProvider } from '#src/generators/prisma/_providers/prisma-generated-imports.js';
import { prismaImportsProvider } from '#src/generators/prisma/prisma/generated/ts-import-providers.js';

import { PRISMA_PRISMA_UTILS_PATHS } from './template-paths.js';
import { PRISMA_PRISMA_UTILS_TEMPLATES } from './typed-templates.js';

export interface PrismaPrismaUtilsRenderers {
  utilsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof PRISMA_PRISMA_UTILS_TEMPLATES.utilsGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const prismaPrismaUtilsRenderers =
  createProviderType<PrismaPrismaUtilsRenderers>(
    'prisma-prisma-utils-renderers',
  );

const prismaPrismaUtilsRenderersTask = createGeneratorTask({
  dependencies: {
    paths: PRISMA_PRISMA_UTILS_PATHS.provider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
    tsUtilsImports: tsUtilsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { prismaPrismaUtilsRenderers: prismaPrismaUtilsRenderers.export() },
  run({
    paths,
    prismaGeneratedImports,
    prismaImports,
    serviceContextImports,
    tsUtilsImports,
    typescriptFile,
  }) {
    return {
      providers: {
        prismaPrismaUtilsRenderers: {
          utilsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: PRISMA_PRISMA_UTILS_TEMPLATES.utilsGroup,
                paths,
                importMapProviders: {
                  prismaGeneratedImports,
                  prismaImports,
                  serviceContextImports,
                  tsUtilsImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const PRISMA_PRISMA_UTILS_RENDERERS = {
  provider: prismaPrismaUtilsRenderers,
  task: prismaPrismaUtilsRenderersTask,
};
