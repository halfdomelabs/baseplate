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
  reactUtilsImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

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
  userSessionCheckGql: {
    render: (
      options: Omit<
        RenderTextTemplateFileActionInput<
          typeof LOCAL_AUTH_CORE_REACT_SESSION_TEMPLATES.userSessionCheckGql
        >,
        'destination' | 'template'
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
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    paths: LOCAL_AUTH_CORE_REACT_SESSION_PATHS.provider,
    reactUtilsImports: reactUtilsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    localAuthCoreReactSessionRenderers:
      localAuthCoreReactSessionRenderers.export(),
  },
  run({ generatedGraphqlImports, paths, reactUtilsImports, typescriptFile }) {
    return {
      providers: {
        localAuthCoreReactSessionRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: LOCAL_AUTH_CORE_REACT_SESSION_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  generatedGraphqlImports,
                  reactUtilsImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          userSessionCheckGql: {
            render: (options) =>
              renderTextTemplateFileAction({
                template:
                  LOCAL_AUTH_CORE_REACT_SESSION_TEMPLATES.userSessionCheckGql,
                destination: paths.userSessionCheckGql,
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
