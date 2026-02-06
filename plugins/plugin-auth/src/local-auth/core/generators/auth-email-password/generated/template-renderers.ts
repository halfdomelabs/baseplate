import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  passwordHasherServiceImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
  requestServiceContextImportsProvider,
  userSessionServiceImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { rateLimitImportsProvider } from '@baseplate-dev/plugin-rate-limit';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authModuleImportsProvider } from '#src/local-auth/core/generators/auth-module/generated/ts-import-providers.js';

import { LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS } from './template-paths.js';
import { LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES } from './typed-templates.js';

export interface LocalAuthCoreAuthEmailPasswordRenderers {
  moduleGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.moduleGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const localAuthCoreAuthEmailPasswordRenderers =
  createProviderType<LocalAuthCoreAuthEmailPasswordRenderers>(
    'local-auth-core-auth-email-password-renderers',
  );

const localAuthCoreAuthEmailPasswordRenderersTask = createGeneratorTask({
  dependencies: {
    authModuleImports: authModuleImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    passwordHasherServiceImports: passwordHasherServiceImportsProvider,
    paths: LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS.provider,
    pothosImports: pothosImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    rateLimitImports: rateLimitImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
    userSessionServiceImports: userSessionServiceImportsProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  exports: {
    localAuthCoreAuthEmailPasswordRenderers:
      localAuthCoreAuthEmailPasswordRenderers.export(),
  },
  run({
    authModuleImports,
    errorHandlerServiceImports,
    passwordHasherServiceImports,
    paths,
    pothosImports,
    prismaGeneratedImports,
    prismaImports,
    rateLimitImports,
    requestServiceContextImports,
    typescriptFile,
    userSessionServiceImports,
    userSessionTypesImports,
  }) {
    return {
      providers: {
        localAuthCoreAuthEmailPasswordRenderers: {
          moduleGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group:
                  LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.moduleGroup,
                paths,
                importMapProviders: {
                  authModuleImports,
                  errorHandlerServiceImports,
                  passwordHasherServiceImports,
                  pothosImports,
                  prismaGeneratedImports,
                  prismaImports,
                  rateLimitImports,
                  requestServiceContextImports,
                  userSessionServiceImports,
                  userSessionTypesImports,
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

export const LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_RENDERERS = {
  provider: localAuthCoreAuthEmailPasswordRenderers,
  task: localAuthCoreAuthEmailPasswordRenderersTask,
};
