import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authContextImportsProvider,
  authRolesImportsProvider,
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
  requestServiceContextImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { queueServiceImportsProvider } from '@baseplate-dev/plugin-queue';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { LOCAL_AUTH_CORE_AUTH_MODULE_PATHS } from './template-paths.js';
import { LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES } from './typed-templates.js';

export interface LocalAuthCoreAuthModuleRenderers {
  constantsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES.constantsGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  moduleGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES.moduleGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  queuesCleanupAuthVerification: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES.queuesCleanupAuthVerification
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  servicesAuthVerification: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES.servicesAuthVerification
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  userSessionService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES.userSessionService
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  utilsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES.utilsGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const localAuthCoreAuthModuleRenderers =
  createProviderType<LocalAuthCoreAuthModuleRenderers>(
    'local-auth-core-auth-module-renderers',
  );

const localAuthCoreAuthModuleRenderersTask = createGeneratorTask({
  dependencies: {
    authContextImports: authContextImportsProvider,
    authRolesImports: authRolesImportsProvider,
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    paths: LOCAL_AUTH_CORE_AUTH_MODULE_PATHS.provider,
    pothosImports: pothosImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    queueServiceImports: queueServiceImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  exports: {
    localAuthCoreAuthModuleRenderers: localAuthCoreAuthModuleRenderers.export(),
  },
  run({
    authContextImports,
    authRolesImports,
    configServiceImports,
    errorHandlerServiceImports,
    paths,
    pothosImports,
    prismaGeneratedImports,
    prismaImports,
    queueServiceImports,
    requestServiceContextImports,
    typescriptFile,
    userSessionTypesImports,
  }) {
    return {
      providers: {
        localAuthCoreAuthModuleRenderers: {
          constantsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES.constantsGroup,
                paths,
                ...options,
              }),
          },
          moduleGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES.moduleGroup,
                paths,
                importMapProviders: {
                  authRolesImports,
                  pothosImports,
                  prismaGeneratedImports,
                  prismaImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          queuesCleanupAuthVerification: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES.queuesCleanupAuthVerification,
                destination: paths.queuesCleanupAuthVerification,
                importMapProviders: {
                  queueServiceImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          servicesAuthVerification: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES.servicesAuthVerification,
                destination: paths.servicesAuthVerification,
                importMapProviders: {
                  prismaGeneratedImports,
                  prismaImports,
                },
                ...options,
              }),
          },
          userSessionService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES.userSessionService,
                destination: paths.userSessionService,
                importMapProviders: {
                  authContextImports,
                  authRolesImports,
                  configServiceImports,
                  errorHandlerServiceImports,
                  prismaImports,
                  requestServiceContextImports,
                  userSessionTypesImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          utilsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: LOCAL_AUTH_CORE_AUTH_MODULE_TEMPLATES.utilsGroup,
                paths,
                importMapProviders: {
                  configServiceImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const LOCAL_AUTH_CORE_AUTH_MODULE_RENDERERS = {
  provider: localAuthCoreAuthModuleRenderers,
  task: localAuthCoreAuthModuleRenderersTask,
};
