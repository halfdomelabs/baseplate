import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { AUTH0_AUTH0_PAGES_PATHS } from './template-paths.js';
import { AUTH0_AUTH0_PAGES_TEMPLATES } from './typed-templates.js';

export interface Auth0Auth0PagesRenderers {
  pagesGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof AUTH0_AUTH0_PAGES_TEMPLATES.pagesGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
}

const auth0Auth0PagesRenderers = createProviderType<Auth0Auth0PagesRenderers>(
  'auth0-auth0-pages-renderers',
);

const auth0Auth0PagesRenderersTask = createGeneratorTask({
  dependencies: {
    authHooksImports: authHooksImportsProvider,
    paths: AUTH0_AUTH0_PAGES_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { auth0Auth0PagesRenderers: auth0Auth0PagesRenderers.export() },
  run({
    authHooksImports,
    paths,
    reactComponentsImports,
    reactErrorImports,
    typescriptFile,
  }) {
    return {
      providers: {
        auth0Auth0PagesRenderers: {
          pagesGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: AUTH0_AUTH0_PAGES_TEMPLATES.pagesGroup,
                paths,
                importMapProviders: {
                  authHooksImports,
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

export const AUTH0_AUTH0_PAGES_RENDERERS = {
  provider: auth0Auth0PagesRenderers,
  task: auth0Auth0PagesRenderersTask,
};
