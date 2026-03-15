import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authRolesImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_PATHS } from './template-paths.js';
import { BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_TEMPLATES } from './typed-templates.js';

export interface BetterAuthBetterAuthAdminModuleRenderers {
  adminAuthMutations: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_TEMPLATES.adminAuthMutations
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  adminAuthService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_TEMPLATES.adminAuthService
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const betterAuthBetterAuthAdminModuleRenderers =
  createProviderType<BetterAuthBetterAuthAdminModuleRenderers>(
    'better-auth-better-auth-admin-module-renderers',
  );

const betterAuthBetterAuthAdminModuleRenderersTask = createGeneratorTask({
  dependencies: {
    authRolesImports: authRolesImportsProvider,
    paths: BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_PATHS.provider,
    pothosImports: pothosImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    betterAuthBetterAuthAdminModuleRenderers:
      betterAuthBetterAuthAdminModuleRenderers.export(),
  },
  run({
    authRolesImports,
    paths,
    pothosImports,
    prismaGeneratedImports,
    prismaImports,
    typescriptFile,
  }) {
    return {
      providers: {
        betterAuthBetterAuthAdminModuleRenderers: {
          adminAuthMutations: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_TEMPLATES.adminAuthMutations,
                destination: paths.adminAuthMutations,
                importMapProviders: {
                  pothosImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          adminAuthService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_TEMPLATES.adminAuthService,
                destination: paths.adminAuthService,
                importMapProviders: {
                  authRolesImports,
                  prismaGeneratedImports,
                  prismaImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const BETTER_AUTH_BETTER_AUTH_ADMIN_MODULE_RENDERERS = {
  provider: betterAuthBetterAuthAdminModuleRenderers,
  task: betterAuthBetterAuthAdminModuleRenderersTask,
};
