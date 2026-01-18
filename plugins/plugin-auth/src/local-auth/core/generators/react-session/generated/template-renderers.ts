import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  graphqlImportsProvider,
  reactComponentsImportsProvider,
  reactErrorImportsProvider,
  reactUtilsImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { localAuthHooksImportsProvider } from '#src/local-auth/core/generators/auth-hooks/generated/ts-import-providers.js';

import { LOCAL_AUTH_CORE_REACT_SESSION_PATHS } from './template-paths.js';
import { LOCAL_AUTH_CORE_REACT_SESSION_TEMPLATES } from './typed-templates.js';

export interface LocalAuthCoreReactSessionRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof LOCAL_AUTH_CORE_REACT_SESSION_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const localAuthCoreReactSessionRenderers =
  createProviderType<LocalAuthCoreReactSessionRenderers>(
    'local-auth-core-react-session-renderers',
  );

const localAuthCoreReactSessionRenderersTask = createGeneratorTask({
  dependencies: {
    authHooksImports: authHooksImportsProvider,
    graphqlImports: graphqlImportsProvider,
    localAuthHooksImports: localAuthHooksImportsProvider,
    paths: LOCAL_AUTH_CORE_REACT_SESSION_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    reactUtilsImports: reactUtilsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    localAuthCoreReactSessionRenderers:
      localAuthCoreReactSessionRenderers.export(),
  },
  run({
    authHooksImports,
    graphqlImports,
    localAuthHooksImports,
    paths,
    reactComponentsImports,
    reactErrorImports,
    reactUtilsImports,
    typescriptFile,
  }) {
    return {
      providers: {
        localAuthCoreReactSessionRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: LOCAL_AUTH_CORE_REACT_SESSION_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  authHooksImports,
                  graphqlImports,
                  localAuthHooksImports,
                  reactComponentsImports,
                  reactErrorImports,
                  reactUtilsImports,
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

export const LOCAL_AUTH_CORE_REACT_SESSION_RENDERERS = {
  provider: localAuthCoreReactSessionRenderers,
  task: localAuthCoreReactSessionRenderersTask,
};
