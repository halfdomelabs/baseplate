import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  graphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactSessionImportsProvider } from '#src/local-auth/core/generators/react-session/generated/ts-import-providers.js';

import { LOCAL_AUTH_CORE_AUTH_HOOKS_PATHS } from './template-paths.js';
import { LOCAL_AUTH_CORE_AUTH_HOOKS_TEMPLATES } from './typed-templates.js';

export interface LocalAuthCoreAuthHooksRenderers {
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
    graphqlImports: graphqlImportsProvider,
    paths: LOCAL_AUTH_CORE_AUTH_HOOKS_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    reactSessionImports: reactSessionImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    localAuthCoreAuthHooksRenderers: localAuthCoreAuthHooksRenderers.export(),
  },
  run({
    graphqlImports,
    paths,
    reactComponentsImports,
    reactErrorImports,
    reactSessionImports,
    typescriptFile,
  }) {
    return {
      providers: {
        localAuthCoreAuthHooksRenderers: {
          hooksGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: LOCAL_AUTH_CORE_AUTH_HOOKS_TEMPLATES.hooksGroup,
                paths,
                importMapProviders: {
                  graphqlImports,
                  reactComponentsImports,
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
