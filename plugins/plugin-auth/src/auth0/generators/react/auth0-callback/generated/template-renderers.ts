import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { AUTH0_AUTH0_CALLBACK_PATHS } from './template-paths.js';
import { AUTH0_AUTH0_CALLBACK_TEMPLATES } from './typed-templates.js';

export interface Auth0Auth0CallbackRenderers {
  auth0CallbackPage: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH0_AUTH0_CALLBACK_TEMPLATES.auth0CallbackPage
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  signupPage: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH0_AUTH0_CALLBACK_TEMPLATES.signupPage
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const auth0Auth0CallbackRenderers =
  createProviderType<Auth0Auth0CallbackRenderers>(
    'auth0-auth0-callback-renderers',
  );

const auth0Auth0CallbackRenderersTask = createGeneratorTask({
  dependencies: {
    authHooksImports: authHooksImportsProvider,
    paths: AUTH0_AUTH0_CALLBACK_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    auth0Auth0CallbackRenderers: auth0Auth0CallbackRenderers.export(),
  },
  run({
    authHooksImports,
    paths,
    reactComponentsImports,
    reactErrorImports,
    typescriptFile,
  }) {
    return {
      providers: {
        auth0Auth0CallbackRenderers: {
          auth0CallbackPage: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: AUTH0_AUTH0_CALLBACK_TEMPLATES.auth0CallbackPage,
                destination: paths.auth0CallbackPage,
                importMapProviders: {
                  authHooksImports,
                  reactComponentsImports,
                  reactErrorImports,
                },
                ...options,
              }),
          },
          signupPage: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: AUTH0_AUTH0_CALLBACK_TEMPLATES.signupPage,
                destination: paths.signupPage,
                importMapProviders: {
                  reactComponentsImports,
                  reactErrorImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH0_AUTH0_CALLBACK_RENDERERS = {
  provider: auth0Auth0CallbackRenderers,
  task: auth0Auth0CallbackRenderersTask,
};
