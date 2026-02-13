import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  apolloErrorImportsProvider,
  graphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactSessionImportsProvider } from '#src/local-auth/core/generators/react-session/generated/ts-import-providers.js';

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
  verifyEmail: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof AUTH_CORE_AUTH_ROUTES_TEMPLATES.verifyEmail
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
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
    graphqlImports: graphqlImportsProvider,
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
    graphqlImports,
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
                  graphqlImports,
                  reactComponentsImports,
                  reactErrorImports,
                  reactSessionImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          verifyEmail: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: AUTH_CORE_AUTH_ROUTES_TEMPLATES.verifyEmail,
                destination: paths.verifyEmail,
                importMapProviders: {
                  apolloErrorImports,
                  graphqlImports,
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

export const AUTH_CORE_AUTH_ROUTES_RENDERERS = {
  provider: authCoreAuthRoutesRenderers,
  task: authCoreAuthRoutesRenderersTask,
};
