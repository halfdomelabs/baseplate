import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authRolesImportsProvider } from '#src/generators/auth/auth-roles/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';

import { AUTH_AUTH_CONTEXT_PATHS } from './template-paths.js';
import { AUTH_AUTH_CONTEXT_TEMPLATES } from './typed-templates.js';

export interface AuthAuthContextRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof AUTH_AUTH_CONTEXT_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const authAuthContextRenderers = createProviderType<AuthAuthContextRenderers>(
  'auth-auth-context-renderers',
);

const authAuthContextRenderersTask = createGeneratorTask({
  dependencies: {
    authRolesImports: authRolesImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    paths: AUTH_AUTH_CONTEXT_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { authAuthContextRenderers: authAuthContextRenderers.export() },
  run({ authRolesImports, errorHandlerServiceImports, paths, typescriptFile }) {
    return {
      providers: {
        authAuthContextRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: AUTH_AUTH_CONTEXT_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  authRolesImports,
                  errorHandlerServiceImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH_AUTH_CONTEXT_RENDERERS = {
  provider: authAuthContextRenderers,
  task: authAuthContextRenderersTask,
};
