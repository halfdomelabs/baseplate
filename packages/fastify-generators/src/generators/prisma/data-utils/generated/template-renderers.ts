import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { serviceContextImportsProvider } from '#src/generators/core/service-context/generated/ts-import-providers.js';
import { prismaGeneratedImportsProvider } from '#src/generators/prisma/_providers/prisma-generated-imports.js';
import { prismaImportsProvider } from '#src/generators/prisma/prisma/generated/ts-import-providers.js';

import { PRISMA_DATA_UTILS_PATHS } from './template-paths.js';
import { PRISMA_DATA_UTILS_TEMPLATES } from './typed-templates.js';

export interface PrismaDataUtilsRenderers {
  dataOperationsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof PRISMA_DATA_UTILS_TEMPLATES.dataOperationsGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const prismaDataUtilsRenderers = createProviderType<PrismaDataUtilsRenderers>(
  'prisma-data-utils-renderers',
);

const prismaDataUtilsRenderersTask = createGeneratorTask({
  dependencies: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    paths: PRISMA_DATA_UTILS_PATHS.provider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { prismaDataUtilsRenderers: prismaDataUtilsRenderers.export() },
  run({
    errorHandlerServiceImports,
    paths,
    prismaGeneratedImports,
    prismaImports,
    serviceContextImports,
    typescriptFile,
  }) {
    return {
      providers: {
        prismaDataUtilsRenderers: {
          dataOperationsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: PRISMA_DATA_UTILS_TEMPLATES.dataOperationsGroup,
                paths,
                importMapProviders: {
                  errorHandlerServiceImports,
                  prismaGeneratedImports,
                  prismaImports,
                  serviceContextImports,
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

export const PRISMA_DATA_UTILS_RENDERERS = {
  provider: prismaDataUtilsRenderers,
  task: prismaDataUtilsRenderersTask,
};
