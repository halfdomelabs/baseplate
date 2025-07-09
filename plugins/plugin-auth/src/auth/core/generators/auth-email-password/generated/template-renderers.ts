import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  passwordHasherServiceImportsProvider,
  pothosImportsProvider,
  prismaImportsProvider,
  requestServiceContextImportsProvider,
  userSessionServiceImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authModuleImportsProvider } from '#src/auth/core/generators/auth-module/generated/ts-import-providers.js';

import { AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS } from './template-paths.js';
import { AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES } from './typed-templates.js';

export interface AuthCoreAuthEmailPasswordRenderers {
  moduleGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.moduleGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
}

const authCoreAuthEmailPasswordRenderers =
  createProviderType<AuthCoreAuthEmailPasswordRenderers>(
    'auth-core-auth-email-password-renderers',
  );

const authCoreAuthEmailPasswordRenderersTask = createGeneratorTask({
  dependencies: {
    authModuleImports: authModuleImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    passwordHasherServiceImports: passwordHasherServiceImportsProvider,
    paths: AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS.provider,
    pothosImports: pothosImportsProvider,
    prismaImports: prismaImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
    userSessionServiceImports: userSessionServiceImportsProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  exports: {
    authCoreAuthEmailPasswordRenderers:
      authCoreAuthEmailPasswordRenderers.export(),
  },
  run({
    authModuleImports,
    errorHandlerServiceImports,
    passwordHasherServiceImports,
    paths,
    pothosImports,
    prismaImports,
    requestServiceContextImports,
    typescriptFile,
    userSessionServiceImports,
    userSessionTypesImports,
  }) {
    return {
      providers: {
        authCoreAuthEmailPasswordRenderers: {
          moduleGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.moduleGroup,
                paths,
                importMapProviders: {
                  authModuleImports,
                  errorHandlerServiceImports,
                  passwordHasherServiceImports,
                  pothosImports,
                  prismaImports,
                  requestServiceContextImports,
                  userSessionServiceImports,
                  userSessionTypesImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH_CORE_AUTH_EMAIL_PASSWORD_RENDERERS = {
  provider: authCoreAuthEmailPasswordRenderers,
  task: authCoreAuthEmailPasswordRenderersTask,
};
