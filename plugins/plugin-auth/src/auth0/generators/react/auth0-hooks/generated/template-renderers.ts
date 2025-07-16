import type {
  RenderTextTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import {
  renderTextTemplateFileAction,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { AUTH0_AUTH0_HOOKS_PATHS } from './template-paths.js';
import { AUTH0_AUTH0_HOOKS_TEMPLATES } from './typed-templates.js';

export interface Auth0Auth0HooksRenderers {
  hooksGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof AUTH0_AUTH0_HOOKS_TEMPLATES.hooksGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  useCurrentUserGql: {
    render: (
      options: Omit<
        RenderTextTemplateFileActionInput<
          typeof AUTH0_AUTH0_HOOKS_TEMPLATES.useCurrentUserGql
        >,
        'destination' | 'template'
      >,
    ) => BuilderAction;
  };
}

const auth0Auth0HooksRenderers = createProviderType<Auth0Auth0HooksRenderers>(
  'auth0-auth0-hooks-renderers',
);

const auth0Auth0HooksRenderersTask = createGeneratorTask({
  dependencies: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    paths: AUTH0_AUTH0_HOOKS_PATHS.provider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { auth0Auth0HooksRenderers: auth0Auth0HooksRenderers.export() },
  run({ generatedGraphqlImports, paths, reactErrorImports, typescriptFile }) {
    return {
      providers: {
        auth0Auth0HooksRenderers: {
          hooksGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: AUTH0_AUTH0_HOOKS_TEMPLATES.hooksGroup,
                paths,
                importMapProviders: {
                  generatedGraphqlImports,
                  reactErrorImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          useCurrentUserGql: {
            render: (options) =>
              renderTextTemplateFileAction({
                template: AUTH0_AUTH0_HOOKS_TEMPLATES.useCurrentUserGql,
                destination: paths.useCurrentUserGql,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH0_AUTH0_HOOKS_RENDERERS = {
  provider: auth0Auth0HooksRenderers,
  task: auth0Auth0HooksRenderersTask,
};
