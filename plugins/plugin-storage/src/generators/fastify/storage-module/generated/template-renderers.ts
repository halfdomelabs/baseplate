import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaUtilsImportsProvider,
  serviceContextImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { FASTIFY_STORAGE_MODULE_PATHS } from './template-paths.js';
import { FASTIFY_STORAGE_MODULE_TEMPLATES } from './typed-templates.js';

export interface FastifyStorageModuleRenderers {
  configAdapters: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.configAdapters
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  configCategories: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.configCategories
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  schemaGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.schemaGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const fastifyStorageModuleRenderers =
  createProviderType<FastifyStorageModuleRenderers>(
    'fastify-storage-module-renderers',
  );

const fastifyStorageModuleRenderersTask = createGeneratorTask({
  dependencies: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    paths: FASTIFY_STORAGE_MODULE_PATHS.provider,
    pothosImports: pothosImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaUtilsImports: prismaUtilsImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    fastifyStorageModuleRenderers: fastifyStorageModuleRenderers.export(),
  },
  run({
    errorHandlerServiceImports,
    paths,
    pothosImports,
    prismaGeneratedImports,
    prismaUtilsImports,
    serviceContextImports,
    typescriptFile,
  }) {
    return {
      providers: {
        fastifyStorageModuleRenderers: {
          configAdapters: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: FASTIFY_STORAGE_MODULE_TEMPLATES.configAdapters,
                destination: paths.configAdapters,
                ...options,
              }),
          },
          configCategories: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: FASTIFY_STORAGE_MODULE_TEMPLATES.configCategories,
                destination: paths.configCategories,
                generatorPaths: paths,
                ...options,
              }),
          },
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: FASTIFY_STORAGE_MODULE_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  errorHandlerServiceImports,
                  prismaGeneratedImports,
                  prismaUtilsImports,
                  serviceContextImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          schemaGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: FASTIFY_STORAGE_MODULE_TEMPLATES.schemaGroup,
                paths,
                importMapProviders: {
                  pothosImports,
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

export const FASTIFY_STORAGE_MODULE_RENDERERS = {
  provider: fastifyStorageModuleRenderers,
  task: fastifyStorageModuleRenderersTask,
};
