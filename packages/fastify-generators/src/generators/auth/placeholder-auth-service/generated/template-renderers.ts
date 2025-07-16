import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authContextImportsProvider } from '#src/generators/auth/auth-context/generated/ts-import-providers.js';
import { userSessionTypesImportsProvider } from '#src/generators/auth/user-session-types/generated/ts-import-providers.js';

import { AUTH_PLACEHOLDER_AUTH_SERVICE_PATHS } from './template-paths.js';
import { AUTH_PLACEHOLDER_AUTH_SERVICE_TEMPLATES } from './typed-templates.js';

export interface AuthPlaceholderAuthServiceRenderers {
  userSessionService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH_PLACEHOLDER_AUTH_SERVICE_TEMPLATES.userSessionService
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const authPlaceholderAuthServiceRenderers =
  createProviderType<AuthPlaceholderAuthServiceRenderers>(
    'auth-placeholder-auth-service-renderers',
  );

const authPlaceholderAuthServiceRenderersTask = createGeneratorTask({
  dependencies: {
    authContextImports: authContextImportsProvider,
    paths: AUTH_PLACEHOLDER_AUTH_SERVICE_PATHS.provider,
    typescriptFile: typescriptFileProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  exports: {
    authPlaceholderAuthServiceRenderers:
      authPlaceholderAuthServiceRenderers.export(),
  },
  run({ authContextImports, paths, typescriptFile, userSessionTypesImports }) {
    return {
      providers: {
        authPlaceholderAuthServiceRenderers: {
          userSessionService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template:
                  AUTH_PLACEHOLDER_AUTH_SERVICE_TEMPLATES.userSessionService,
                destination: paths.userSessionService,
                importMapProviders: {
                  authContextImports,
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

export const AUTH_PLACEHOLDER_AUTH_SERVICE_RENDERERS = {
  provider: authPlaceholderAuthServiceRenderers,
  task: authPlaceholderAuthServiceRenderersTask,
};
