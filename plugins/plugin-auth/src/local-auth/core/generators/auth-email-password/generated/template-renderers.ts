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
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { rateLimitImportsProvider } from '@baseplate-dev/plugin-rate-limit';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authModuleImportsProvider } from '#src/local-auth/core/generators/auth-module/generated/ts-import-providers.js';

import { LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS } from './template-paths.js';
import { LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES } from './typed-templates.js';

export interface LocalAuthCoreAuthEmailPasswordRenderers {
  constantsOtp: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.constantsOtp
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
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
  schemaEmailOtpMutations: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.schemaEmailOtpMutations
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
  servicesEmailOtp: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.servicesEmailOtp
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
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    passwordHasherServiceImports: passwordHasherServiceImportsProvider,
    paths: LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS.provider,
    pothosImports: pothosImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    rateLimitImports: rateLimitImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
    typescriptFile: typescriptFileProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  exports: {
    localAuthCoreAuthEmailPasswordRenderers:
      localAuthCoreAuthEmailPasswordRenderers.export(),
  },
  run({
    authModuleImports,
    configServiceImports,
    errorHandlerServiceImports,
    passwordHasherServiceImports,
    paths,
    pothosImports,
    prismaGeneratedImports,
    prismaImports,
    rateLimitImports,
    requestServiceContextImports,
    typescriptFile,
    userSessionTypesImports,
  }) {
    return {
      providers: {
        localAuthCoreAuthEmailPasswordRenderers: {
          constantsOtp: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.constantsOtp,
                destination: paths.constantsOtp,
                ...options,
              }),
          },
          moduleGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group:
                  LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.moduleGroup,
                paths,
                importMapProviders: {
                  authModuleImports,
                  configServiceImports,
                  errorHandlerServiceImports,
                  passwordHasherServiceImports,
                  pothosImports,
                  prismaGeneratedImports,
                  prismaImports,
                  rateLimitImports,
                  requestServiceContextImports,
                  userSessionTypesImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          schemaEmailOtpMutations: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.schemaEmailOtpMutations,
                destination: paths.schemaEmailOtpMutations,
                importMapProviders: {
                  authModuleImports,
                  pothosImports,
                },
                generatorPaths: paths,
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
          servicesEmailOtp: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES.servicesEmailOtp,
                destination: paths.servicesEmailOtp,
                importMapProviders: {
                  authModuleImports,
                  configServiceImports,
                  errorHandlerServiceImports,
                  prismaImports,
                  rateLimitImports,
                  requestServiceContextImports,
                  userSessionTypesImports,
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
