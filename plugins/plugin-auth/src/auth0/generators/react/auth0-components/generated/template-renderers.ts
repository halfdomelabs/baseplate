import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { reactComponentsImportsProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { AUTH0_AUTH0_COMPONENTS_PATHS } from './template-paths.js';
import { AUTH0_AUTH0_COMPONENTS_TEMPLATES } from './typed-templates.js';

export interface Auth0Auth0ComponentsRenderers {
  requireAuth: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH0_AUTH0_COMPONENTS_TEMPLATES.requireAuth
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const auth0Auth0ComponentsRenderers =
  createProviderType<Auth0Auth0ComponentsRenderers>(
    'auth0-auth0-components-renderers',
  );

const auth0Auth0ComponentsRenderersTask = createGeneratorTask({
  dependencies: {
    paths: AUTH0_AUTH0_COMPONENTS_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    auth0Auth0ComponentsRenderers: auth0Auth0ComponentsRenderers.export(),
  },
  run({ paths, reactComponentsImports, typescriptFile }) {
    return {
      providers: {
        auth0Auth0ComponentsRenderers: {
          requireAuth: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: AUTH0_AUTH0_COMPONENTS_TEMPLATES.requireAuth,
                destination: paths.requireAuth,
                importMapProviders: {
                  reactComponentsImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH0_AUTH0_COMPONENTS_RENDERERS = {
  provider: auth0Auth0ComponentsRenderers,
  task: auth0Auth0ComponentsRenderersTask,
};
