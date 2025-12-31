import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { APOLLO_REACT_APOLLO_PATHS } from './template-paths.js';
import { APOLLO_REACT_APOLLO_TEMPLATES } from './typed-templates.js';

export interface ApolloReactApolloRenderers {
  graphql: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof APOLLO_REACT_APOLLO_TEMPLATES.graphql
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof APOLLO_REACT_APOLLO_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const apolloReactApolloRenderers =
  createProviderType<ApolloReactApolloRenderers>(
    'apollo-react-apollo-renderers',
  );

const apolloReactApolloRenderersTask = createGeneratorTask({
  dependencies: {
    paths: APOLLO_REACT_APOLLO_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { apolloReactApolloRenderers: apolloReactApolloRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        apolloReactApolloRenderers: {
          graphql: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: APOLLO_REACT_APOLLO_TEMPLATES.graphql,
                destination: paths.graphql,
                ...options,
              }),
          },
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: APOLLO_REACT_APOLLO_TEMPLATES.mainGroup,
                paths,
                generatorPaths: paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const APOLLO_REACT_APOLLO_RENDERERS = {
  provider: apolloReactApolloRenderers,
  task: apolloReactApolloRenderersTask,
};
