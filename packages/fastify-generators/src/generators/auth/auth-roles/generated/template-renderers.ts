import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { AUTH_AUTH_ROLES_PATHS } from './template-paths.js';
import { AUTH_AUTH_ROLES_TEMPLATES } from './typed-templates.js';

export interface AuthAuthRolesRenderers {
  authRoles: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH_AUTH_ROLES_TEMPLATES.authRoles
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const authAuthRolesRenderers = createProviderType<AuthAuthRolesRenderers>(
  'auth-auth-roles-renderers',
);

const authAuthRolesRenderersTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_AUTH_ROLES_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { authAuthRolesRenderers: authAuthRolesRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        authAuthRolesRenderers: {
          authRoles: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: AUTH_AUTH_ROLES_TEMPLATES.authRoles,
                destination: paths.authRoles,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH_AUTH_ROLES_RENDERERS = {
  provider: authAuthRolesRenderers,
  task: authAuthRolesRenderersTask,
};
