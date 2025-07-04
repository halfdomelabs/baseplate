import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  pothosImportsProvider,
  prismaUtilsImportsProvider,
  serviceContextImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { FASTIFY_STORAGE_MODULE_PATHS } from './template-paths.js';
import { FASTIFY_STORAGE_MODULE_TEMPLATES } from './typed-templates.js';

export interface FastifyStorageModuleRenderers {
  adaptersGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.adaptersGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  constantsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.constantsGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  schemaGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.schemaGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  servicesGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.servicesGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  utilsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof FASTIFY_STORAGE_MODULE_TEMPLATES.utilsGroup
        >,
        'importMapProviders' | 'group' | 'paths'
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
    prismaUtilsImports,
    serviceContextImports,
    typescriptFile,
  }) {
    return {
      providers: {
        fastifyStorageModuleRenderers: {
          adaptersGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: FASTIFY_STORAGE_MODULE_TEMPLATES.adaptersGroup,
                paths,
                ...options,
              }),
          },
          constantsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: FASTIFY_STORAGE_MODULE_TEMPLATES.constantsGroup,
                paths,
                importMapProviders: {
                  serviceContextImports,
                },
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
                ...options,
              }),
          },
          servicesGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: FASTIFY_STORAGE_MODULE_TEMPLATES.servicesGroup,
                paths,
                importMapProviders: {
                  errorHandlerServiceImports,
                  prismaUtilsImports,
                  serviceContextImports,
                },
                ...options,
              }),
          },
          utilsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: FASTIFY_STORAGE_MODULE_TEMPLATES.utilsGroup,
                paths,
                importMapProviders: {
                  errorHandlerServiceImports,
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

export const FASTIFY_STORAGE_MODULE_RENDERERS = {
  provider: fastifyStorageModuleRenderers,
  task: fastifyStorageModuleRenderersTask,
};
