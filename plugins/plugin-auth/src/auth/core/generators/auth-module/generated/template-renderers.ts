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
  requestServiceContextImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { AUTH_CORE_AUTH_MODULE_PATHS } from './template-paths.js';
import { AUTH_CORE_AUTH_MODULE_TEMPLATES } from './typed-templates.js';

export interface AuthCoreAuthModuleRenderers {
  constantsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof AUTH_CORE_AUTH_MODULE_TEMPLATES.constantsGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  userSessionService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH_CORE_AUTH_MODULE_TEMPLATES.userSessionService
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  utilsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof AUTH_CORE_AUTH_MODULE_TEMPLATES.utilsGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
}

const authCoreAuthModuleRenderers =
  createProviderType<AuthCoreAuthModuleRenderers>(
    'auth-core-auth-module-renderers',
  );

const authCoreAuthModuleRenderersTask = createGeneratorTask({
  dependencies: {
    authContextImports: authContextImportsProvider,
    authRolesImports: authRolesImportsProvider,
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    paths: AUTH_CORE_AUTH_MODULE_PATHS.provider,
    requestServiceContextImports: requestServiceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  exports: {
    authCoreAuthModuleRenderers: authCoreAuthModuleRenderers.export(),
  },
  run({
    authContextImports,
    authRolesImports,
    configServiceImports,
    errorHandlerServiceImports,
    paths,
    requestServiceContextImports,
    typescriptFile,
    userSessionTypesImports,
  }) {
    return {
      providers: {
        authCoreAuthModuleRenderers: {
          constantsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: AUTH_CORE_AUTH_MODULE_TEMPLATES.constantsGroup,
                paths,
                ...options,
              }),
          },
          userSessionService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: AUTH_CORE_AUTH_MODULE_TEMPLATES.userSessionService,
                destination: paths.userSessionService,
                importMapProviders: {
                  authContextImports,
                  authRolesImports,
                  configServiceImports,
                  errorHandlerServiceImports,
                  requestServiceContextImports,
                  userSessionTypesImports,
                },
                ...options,
              }),
          },
          utilsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: AUTH_CORE_AUTH_MODULE_TEMPLATES.utilsGroup,
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

export const AUTH_CORE_AUTH_MODULE_RENDERERS = {
  provider: authCoreAuthModuleRenderers,
  task: authCoreAuthModuleRenderersTask,
};
