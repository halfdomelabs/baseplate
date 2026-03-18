import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

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
  defineTransformer: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof PRISMA_DATA_UTILS_TEMPLATES.defineTransformer
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  executeTransformPlan: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof PRISMA_DATA_UTILS_TEMPLATES.executeTransformPlan
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  nestedTransformers: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof PRISMA_DATA_UTILS_TEMPLATES.nestedTransformers
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  prepareTransformers: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof PRISMA_DATA_UTILS_TEMPLATES.prepareTransformers
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  prismaTypes: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof PRISMA_DATA_UTILS_TEMPLATES.prismaTypes
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  transformerTypes: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof PRISMA_DATA_UTILS_TEMPLATES.transformerTypes
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const prismaDataUtilsRenderers = createProviderType<PrismaDataUtilsRenderers>(
  'prisma-data-utils-renderers',
);

const prismaDataUtilsRenderersTask = createGeneratorTask({
  dependencies: {
    paths: PRISMA_DATA_UTILS_PATHS.provider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { prismaDataUtilsRenderers: prismaDataUtilsRenderers.export() },
  run({
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
                ...options,
              }),
          },
          defineTransformer: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: PRISMA_DATA_UTILS_TEMPLATES.defineTransformer,
                destination: paths.defineTransformer,
                importMapProviders: {
                  serviceContextImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          executeTransformPlan: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: PRISMA_DATA_UTILS_TEMPLATES.executeTransformPlan,
                destination: paths.executeTransformPlan,
                importMapProviders: {
                  prismaGeneratedImports,
                  prismaImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          nestedTransformers: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: PRISMA_DATA_UTILS_TEMPLATES.nestedTransformers,
                destination: paths.nestedTransformers,
                importMapProviders: {
                  prismaGeneratedImports,
                  serviceContextImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          prepareTransformers: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: PRISMA_DATA_UTILS_TEMPLATES.prepareTransformers,
                destination: paths.prepareTransformers,
                importMapProviders: {
                  serviceContextImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          prismaTypes: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: PRISMA_DATA_UTILS_TEMPLATES.prismaTypes,
                destination: paths.prismaTypes,
                importMapProviders: {
                  prismaGeneratedImports,
                  prismaImports,
                },
                ...options,
              }),
          },
          transformerTypes: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: PRISMA_DATA_UTILS_TEMPLATES.transformerTypes,
                destination: paths.transformerTypes,
                importMapProviders: {
                  prismaGeneratedImports,
                  serviceContextImports,
                },
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
