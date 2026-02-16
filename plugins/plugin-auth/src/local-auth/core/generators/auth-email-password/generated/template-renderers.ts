import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  passwordHasherServiceImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
  requestServiceContextImportsProvider,
  userSessionServiceImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { emailModuleImportsProvider } from '@baseplate-dev/plugin-email';
import { queueServiceImportsProvider } from '@baseplate-dev/plugin-queue';
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
  queuesCleanupAuthVerification: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.queuesCleanupAuthVerification
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  schemaEmailVerificationMutations: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.schemaEmailVerificationMutations
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  servicesEmailVerification: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.servicesEmailVerification
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
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
    configServiceImports: configServiceImportsProvider,
    emailModuleImports: emailModuleImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    passwordHasherServiceImports: passwordHasherServiceImportsProvider,
    paths: LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS.provider,
    pothosImports: pothosImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    queueServiceImports: queueServiceImportsProvider,
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
    configServiceImports,
    emailModuleImports,
    errorHandlerServiceImports,
    passwordHasherServiceImports,
    paths,
    pothosImports,
    prismaGeneratedImports,
    prismaImports,
    queueServiceImports,
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
                  configServiceImports,
                  emailModuleImports,
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
          queuesCleanupAuthVerification: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.queuesCleanupAuthVerification,
                destination: paths.queuesCleanupAuthVerification,
                importMapProviders: {
                  authModuleImports,
                  queueServiceImports,
                },
                ...options,
              }),
          },
          schemaEmailVerificationMutations: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.schemaEmailVerificationMutations,
                destination: paths.schemaEmailVerificationMutations,
                importMapProviders: {
                  pothosImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          servicesEmailVerification: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.servicesEmailVerification,
                destination: paths.servicesEmailVerification,
                importMapProviders: {
                  authModuleImports,
                  configServiceImports,
                  emailModuleImports,
                  errorHandlerServiceImports,
                  prismaImports,
                  rateLimitImports,
                  requestServiceContextImports,
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
