import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  dataUtilsImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
  serviceContextImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { queueServiceImportsProvider } from '@baseplate-dev/plugin-queue';
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
  queuesCleanUnusedFiles: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.queuesCleanUnusedFiles
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
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
  servicesCleanUnusedFiles: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.servicesCleanUnusedFiles
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  servicesGetPublicUrl: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.servicesGetPublicUrl
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
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
    dataUtilsImports: dataUtilsImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: FASTIFY_STORAGE_MODULE_PATHS.provider,
    pothosImports: pothosImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    queueServiceImports: queueServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    fastifyStorageModuleRenderers: fastifyStorageModuleRenderers.export(),
  },
  run({
    dataUtilsImports,
    errorHandlerServiceImports,
    loggerServiceImports,
    paths,
    pothosImports,
    prismaGeneratedImports,
    prismaImports,
    queueServiceImports,
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
                  dataUtilsImports,
                  errorHandlerServiceImports,
                  prismaGeneratedImports,
                  prismaImports,
                  serviceContextImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          queuesCleanUnusedFiles: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  FASTIFY_STORAGE_MODULE_TEMPLATES.queuesCleanUnusedFiles,
                destination: paths.queuesCleanUnusedFiles,
                importMapProviders: {
                  queueServiceImports,
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
          servicesCleanUnusedFiles: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  FASTIFY_STORAGE_MODULE_TEMPLATES.servicesCleanUnusedFiles,
                destination: paths.servicesCleanUnusedFiles,
                importMapProviders: {
                  errorHandlerServiceImports,
                  loggerServiceImports,
                  prismaImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          servicesGetPublicUrl: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: FASTIFY_STORAGE_MODULE_TEMPLATES.servicesGetPublicUrl,
                destination: paths.servicesGetPublicUrl,
                importMapProviders: {
                  prismaGeneratedImports,
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
