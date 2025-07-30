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

import { reactSessionImportsProvider } from '#src/local-auth/core/generators/react-session/generated/ts-import-providers.js';

import { LOCAL_AUTH_CORE_AUTH_HOOKS_PATHS } from './template-paths.js';
import { LOCAL_AUTH_CORE_AUTH_HOOKS_TEMPLATES } from './typed-templates.js';

export interface LocalAuthCoreAuthHooksRenderers {
  hooksGqlGroup: {
    render: (
      options: Omit<
        RenderTextTemplateGroupActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_HOOKS_TEMPLATES.hooksGqlGroup
        >,
        'group' | 'paths'
      >,
    ) => BuilderAction;
  };
  hooksGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof LOCAL_AUTH_CORE_AUTH_HOOKS_TEMPLATES.hooksGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const localAuthCoreAuthHooksRenderers =
  createProviderType<LocalAuthCoreAuthHooksRenderers>(
    'local-auth-core-auth-hooks-renderers',
  );

const localAuthCoreAuthHooksRenderersTask = createGeneratorTask({
  dependencies: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    paths: LOCAL_AUTH_CORE_AUTH_HOOKS_PATHS.provider,
    reactErrorImports: reactErrorImportsProvider,
    reactSessionImports: reactSessionImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    localAuthCoreAuthHooksRenderers: localAuthCoreAuthHooksRenderers.export(),
  },
  run({
    generatedGraphqlImports,
    paths,
    reactErrorImports,
    reactSessionImports,
    typescriptFile,
  }) {
    return {
      providers: {
        localAuthCoreAuthHooksRenderers: {
          hooksGqlGroup: {
            render: (options) =>
              renderTextTemplateGroupAction({
                group: LOCAL_AUTH_CORE_AUTH_HOOKS_TEMPLATES.hooksGqlGroup,
                paths,
                ...options,
              }),
          },
          hooksGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: LOCAL_AUTH_CORE_AUTH_HOOKS_TEMPLATES.hooksGroup,
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

export const LOCAL_AUTH_CORE_AUTH_HOOKS_RENDERERS = {
  provider: localAuthCoreAuthHooksRenderers,
  task: localAuthCoreAuthHooksRenderersTask,
};
