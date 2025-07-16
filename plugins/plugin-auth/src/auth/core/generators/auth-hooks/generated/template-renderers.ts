import type {
  RenderTextTemplateGroupActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import {
  renderTextTemplateGroupAction,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactSessionImportsProvider } from '#src/auth/core/generators/react-session/generated/ts-import-providers.js';

import { AUTH_CORE_AUTH_HOOKS_PATHS } from './template-paths.js';
import { AUTH_CORE_AUTH_HOOKS_TEMPLATES } from './typed-templates.js';

export interface AuthCoreAuthHooksRenderers {
  hooksGqlGroup: {
    render: (
      options: Omit<
        RenderTextTemplateGroupActionInput<
          typeof AUTH_CORE_AUTH_HOOKS_TEMPLATES.hooksGqlGroup
        >,
        'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  hooksGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof AUTH_CORE_AUTH_HOOKS_TEMPLATES.hooksGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const authCoreAuthHooksRenderers =
  createProviderType<AuthCoreAuthHooksRenderers>(
    'auth-core-auth-hooks-renderers',
  );

const authCoreAuthHooksRenderersTask = createGeneratorTask({
  dependencies: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    paths: AUTH_CORE_AUTH_HOOKS_PATHS.provider,
    reactErrorImports: reactErrorImportsProvider,
    reactSessionImports: reactSessionImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { authCoreAuthHooksRenderers: authCoreAuthHooksRenderers.export() },
  run({
    generatedGraphqlImports,
    paths,
    reactErrorImports,
    reactSessionImports,
    typescriptFile,
  }) {
    return {
      providers: {
        authCoreAuthHooksRenderers: {
          hooksGqlGroup: {
            render: (options) =>
              renderTextTemplateGroupAction({
                group: AUTH_CORE_AUTH_HOOKS_TEMPLATES.hooksGqlGroup,
                paths,
                ...options,
              }),
          },
          hooksGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: AUTH_CORE_AUTH_HOOKS_TEMPLATES.hooksGroup,
                paths,
                importMapProviders: {
                  generatedGraphqlImports,
                  reactErrorImports,
                  reactSessionImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH_CORE_AUTH_HOOKS_RENDERERS = {
  provider: authCoreAuthHooksRenderers,
  task: authCoreAuthHooksRenderersTask,
};
