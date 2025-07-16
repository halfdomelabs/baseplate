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
  apolloErrorImportsProvider,
  generatedGraphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactSessionImportsProvider } from '#src/auth/core/generators/react-session/generated/ts-import-providers.js';

import { AUTH_CORE_AUTH_ROUTES_PATHS } from './template-paths.js';
import { AUTH_CORE_AUTH_ROUTES_TEMPLATES } from './typed-templates.js';

export interface AuthCoreAuthRoutesRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof AUTH_CORE_AUTH_ROUTES_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  queriesGql: {
    render: (
      options: Omit<
        RenderTextTemplateFileActionInput<
          typeof AUTH_CORE_AUTH_ROUTES_TEMPLATES.queriesGql
        >,
        'destination' | 'template'
      >,
    ) => BuilderAction;
  };
}

const authCoreAuthRoutesRenderers =
  createProviderType<AuthCoreAuthRoutesRenderers>(
    'auth-core-auth-routes-renderers',
  );

const authCoreAuthRoutesRenderersTask = createGeneratorTask({
  dependencies: {
    apolloErrorImports: apolloErrorImportsProvider,
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    paths: AUTH_CORE_AUTH_ROUTES_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    reactSessionImports: reactSessionImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    authCoreAuthRoutesRenderers: authCoreAuthRoutesRenderers.export(),
  },
  run({
    apolloErrorImports,
    generatedGraphqlImports,
    paths,
    reactComponentsImports,
    reactErrorImports,
    reactSessionImports,
    typescriptFile,
  }) {
    return {
      providers: {
        authCoreAuthRoutesRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: AUTH_CORE_AUTH_ROUTES_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  apolloErrorImports,
                  generatedGraphqlImports,
                  reactComponentsImports,
                  reactErrorImports,
                  reactSessionImports,
                },
                ...options,
              }),
          },
          queriesGql: {
            render: (options) =>
              renderTextTemplateFileAction({
                template: AUTH_CORE_AUTH_ROUTES_TEMPLATES.queriesGql,
                destination: paths.queriesGql,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH_CORE_AUTH_ROUTES_RENDERERS = {
  provider: authCoreAuthRoutesRenderers,
  task: authCoreAuthRoutesRenderersTask,
};
