import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  generatedGraphqlImportsProvider,
  reactUtilsImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { AUTH_CORE_REACT_SESSION_PATHS } from './template-paths.js';
import { AUTH_CORE_REACT_SESSION_TEMPLATES } from './typed-templates.js';

export interface AuthCoreReactSessionRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof AUTH_CORE_REACT_SESSION_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths'
      >,
    ) => BuilderAction;
  };
}

const authCoreReactSessionRenderers =
  createProviderType<AuthCoreReactSessionRenderers>(
    'auth-core-react-session-renderers',
  );

const authCoreReactSessionRenderersTask = createGeneratorTask({
  dependencies: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    paths: AUTH_CORE_REACT_SESSION_PATHS.provider,
    reactUtilsImports: reactUtilsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    authCoreReactSessionRenderers: authCoreReactSessionRenderers.export(),
  },
  run({ generatedGraphqlImports, paths, reactUtilsImports, typescriptFile }) {
    return {
      providers: {
        authCoreReactSessionRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: AUTH_CORE_REACT_SESSION_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  generatedGraphqlImports,
                  reactUtilsImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const AUTH_CORE_REACT_SESSION_RENDERERS = {
  provider: authCoreReactSessionRenderers,
  task: authCoreReactSessionRenderersTask,
};
