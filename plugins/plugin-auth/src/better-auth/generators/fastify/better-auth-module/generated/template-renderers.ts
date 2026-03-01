import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authContextImportsProvider,
  authRolesImportsProvider,
  configServiceImportsProvider,
  pothosImportsProvider,
  prismaImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { BETTER_AUTH_BETTER_AUTH_MODULE_PATHS } from './template-paths.js';
import { BETTER_AUTH_BETTER_AUTH_MODULE_TEMPLATES } from './typed-templates.js';

export interface BetterAuthBetterAuthModuleRenderers {
  auth: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_BETTER_AUTH_MODULE_TEMPLATES.auth
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  betterAuthPlugin: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_BETTER_AUTH_MODULE_TEMPLATES.betterAuthPlugin
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  headersUtils: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_BETTER_AUTH_MODULE_TEMPLATES.headersUtils
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  userSessionQueries: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_BETTER_AUTH_MODULE_TEMPLATES.userSessionQueries
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  userSessionService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof BETTER_AUTH_BETTER_AUTH_MODULE_TEMPLATES.userSessionService
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const betterAuthBetterAuthModuleRenderers =
  createProviderType<BetterAuthBetterAuthModuleRenderers>(
    'better-auth-better-auth-module-renderers',
  );

const betterAuthBetterAuthModuleRenderersTask = createGeneratorTask({
  dependencies: {
    authContextImports: authContextImportsProvider,
    authRolesImports: authRolesImportsProvider,
    configServiceImports: configServiceImportsProvider,
    paths: BETTER_AUTH_BETTER_AUTH_MODULE_PATHS.provider,
    pothosImports: pothosImportsProvider,
    prismaImports: prismaImportsProvider,
    typescriptFile: typescriptFileProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  exports: {
    betterAuthBetterAuthModuleRenderers:
      betterAuthBetterAuthModuleRenderers.export(),
  },
  run({
    authContextImports,
    authRolesImports,
    configServiceImports,
    paths,
    pothosImports,
    prismaImports,
    typescriptFile,
    userSessionTypesImports,
  }) {
    return {
      providers: {
        betterAuthBetterAuthModuleRenderers: {
          auth: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: BETTER_AUTH_BETTER_AUTH_MODULE_TEMPLATES.auth,
                destination: paths.auth,
                importMapProviders: {
                  authRolesImports,
                  configServiceImports,
                  prismaImports,
                },
                ...options,
              }),
          },
          betterAuthPlugin: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  BETTER_AUTH_BETTER_AUTH_MODULE_TEMPLATES.betterAuthPlugin,
                destination: paths.betterAuthPlugin,
                generatorPaths: paths,
                ...options,
              }),
          },
          headersUtils: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: BETTER_AUTH_BETTER_AUTH_MODULE_TEMPLATES.headersUtils,
                destination: paths.headersUtils,
                ...options,
              }),
          },
          userSessionQueries: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  BETTER_AUTH_BETTER_AUTH_MODULE_TEMPLATES.userSessionQueries,
                destination: paths.userSessionQueries,
                importMapProviders: {
                  pothosImports,
                  prismaImports,
                },
                ...options,
              }),
          },
          userSessionService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  BETTER_AUTH_BETTER_AUTH_MODULE_TEMPLATES.userSessionService,
                destination: paths.userSessionService,
                importMapProviders: {
                  authContextImports,
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

export const BETTER_AUTH_BETTER_AUTH_MODULE_RENDERERS = {
  provider: betterAuthBetterAuthModuleRenderers,
  task: betterAuthBetterAuthModuleRenderersTask,
};
