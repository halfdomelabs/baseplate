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
import { queuesImportsProvider } from '@baseplate-dev/plugin-queue';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { FASTIFY_STORAGE_MODULE_PATHS } from './template-paths.js';
import { FASTIFY_STORAGE_MODULE_TEMPLATES } from './typed-templates.js';

export interface FastifyStorageModuleRenderers {
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
  queuesCleanUnusedFilesWorker: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.queuesCleanUnusedFilesWorker
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
  servicesStorage: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.servicesStorage
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  storageTestHelper: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.storageTestHelper
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  utilsValidatePendingUpload: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.utilsValidatePendingUpload
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
    queuesImports: queuesImportsProvider,
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
    queuesImports,
    serviceContextImports,
    typescriptFile,
  }) {
    return {
      providers: {
        fastifyStorageModuleRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: FASTIFY_STORAGE_MODULE_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  dataUtilsImports,
                  errorHandlerServiceImports,
                  prismaGeneratedImports,
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
                  queuesImports,
                },
                ...options,
              }),
          },
          queuesCleanUnusedFilesWorker: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  FASTIFY_STORAGE_MODULE_TEMPLATES.queuesCleanUnusedFilesWorker,
                destination: paths.queuesCleanUnusedFilesWorker,
                importMapProviders: {
                  queuesImports,
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
                  serviceContextImports,
                },
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
                  serviceContextImports,
                },
                ...options,
              }),
          },
          servicesStorage: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: FASTIFY_STORAGE_MODULE_TEMPLATES.servicesStorage,
                destination: paths.servicesStorage,
                generatorPaths: paths,
                ...options,
              }),
          },
          storageTestHelper: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: FASTIFY_STORAGE_MODULE_TEMPLATES.storageTestHelper,
                destination: paths.storageTestHelper,
                generatorPaths: paths,
                ...options,
              }),
          },
          utilsValidatePendingUpload: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  FASTIFY_STORAGE_MODULE_TEMPLATES.utilsValidatePendingUpload,
                destination: paths.utilsValidatePendingUpload,
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

export const FASTIFY_STORAGE_MODULE_RENDERERS = {
  provider: fastifyStorageModuleRenderers,
  task: fastifyStorageModuleRenderersTask,
};
