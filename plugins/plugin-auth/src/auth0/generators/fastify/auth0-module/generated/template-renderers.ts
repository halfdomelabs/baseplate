import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authContextImportsProvider,
  authRolesImportsProvider,
  configServiceImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { AUTH0_AUTH0_MODULE_PATHS } from './template-paths.js';
import { AUTH0_AUTH0_MODULE_TEMPLATES } from './typed-templates.js';

export interface Auth0Auth0ModuleRenderers {
  management: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH0_AUTH0_MODULE_TEMPLATES.management
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  userSessionService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH0_AUTH0_MODULE_TEMPLATES.userSessionService
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const auth0Auth0ModuleRenderers = createProviderType<Auth0Auth0ModuleRenderers>(
  'auth0-auth0-module-renderers',
);

const auth0Auth0ModuleRenderersTask = createGeneratorTask({
  dependencies: {
    authContextImports: authContextImportsProvider,
    authRolesImports: authRolesImportsProvider,
    configServiceImports: configServiceImportsProvider,
    paths: AUTH0_AUTH0_MODULE_PATHS.provider,
    typescriptFile: typescriptFileProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  exports: { auth0Auth0ModuleRenderers: auth0Auth0ModuleRenderers.export() },
  run({
    authContextImports,
    authRolesImports,
    configServiceImports,
    paths,
    typescriptFile,
    userSessionTypesImports,
  }) {
    return {
      providers: {
        auth0Auth0ModuleRenderers: {
          management: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: AUTH0_AUTH0_MODULE_TEMPLATES.management,
                destination: paths.management,
                importMapProviders: {
                  configServiceImports,
                },
                ...options,
              }),
          },
          userSessionService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: AUTH0_AUTH0_MODULE_TEMPLATES.userSessionService,
                destination: paths.userSessionService,
                importMapProviders: {
                  authContextImports,
                  authRolesImports,
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

export const AUTH0_AUTH0_MODULE_RENDERERS = {
  provider: auth0Auth0ModuleRenderers,
  task: auth0Auth0ModuleRenderersTask,
};
