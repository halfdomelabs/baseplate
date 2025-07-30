import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { AUTH_AUTH_ERRORS_PATHS } from './template-paths.js';
import { AUTH_AUTH_ERRORS_TEMPLATES } from './typed-templates.js';

export interface AuthAuthErrorsRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof AUTH_AUTH_ERRORS_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const authAuthErrorsRenderers = createProviderType<AuthAuthErrorsRenderers>(
  'auth-auth-errors-renderers',
);

const authAuthErrorsRenderersTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_AUTH_ERRORS_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { authAuthErrorsRenderers: authAuthErrorsRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        authAuthErrorsRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: AUTH_AUTH_ERRORS_TEMPLATES.mainGroup,
                paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH_AUTH_ERRORS_RENDERERS = {
  provider: authAuthErrorsRenderers,
  task: authAuthErrorsRenderersTask,
};
