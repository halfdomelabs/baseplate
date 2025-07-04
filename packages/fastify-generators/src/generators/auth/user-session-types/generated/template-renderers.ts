import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authContextImportsProvider } from '#src/generators/auth/auth-context/generated/ts-import-providers.js';

import { AUTH_USER_SESSION_TYPES_PATHS } from './template-paths.js';
import { AUTH_USER_SESSION_TYPES_TEMPLATES } from './typed-templates.js';

export interface AuthUserSessionTypesRenderers {
  userSessionTypes: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH_USER_SESSION_TYPES_TEMPLATES.userSessionTypes
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const authUserSessionTypesRenderers =
  createProviderType<AuthUserSessionTypesRenderers>(
    'auth-user-session-types-renderers',
  );

const authUserSessionTypesRenderersTask = createGeneratorTask({
  dependencies: {
    authContextImports: authContextImportsProvider,
    paths: AUTH_USER_SESSION_TYPES_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    authUserSessionTypesRenderers: authUserSessionTypesRenderers.export(),
  },
  run({ authContextImports, paths, typescriptFile }) {
    return {
      providers: {
        authUserSessionTypesRenderers: {
          userSessionTypes: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: AUTH_USER_SESSION_TYPES_TEMPLATES.userSessionTypes,
                destination: paths.userSessionTypes,
                importMapProviders: {
                  authContextImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH_USER_SESSION_TYPES_RENDERERS = {
  provider: authUserSessionTypesRenderers,
  task: authUserSessionTypesRenderersTask,
};
