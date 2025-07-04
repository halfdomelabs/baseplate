import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { APOLLO_REACT_APOLLO_PATHS } from './template-paths.js';
import { APOLLO_REACT_APOLLO_TEMPLATES } from './typed-templates.js';

export interface ApolloReactApolloRenderers {
  appApolloProvider: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof APOLLO_REACT_APOLLO_TEMPLATES.appApolloProvider
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  cache: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof APOLLO_REACT_APOLLO_TEMPLATES.cache
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  graphql: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof APOLLO_REACT_APOLLO_TEMPLATES.graphql
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  service: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof APOLLO_REACT_APOLLO_TEMPLATES.service
        >,
        'destination' | 'importMapProviders' | 'template'
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
          appApolloProvider: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: APOLLO_REACT_APOLLO_TEMPLATES.appApolloProvider,
                destination: paths.appApolloProvider,
                ...options,
              }),
          },
          cache: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: APOLLO_REACT_APOLLO_TEMPLATES.cache,
                destination: paths.cache,
                ...options,
              }),
          },
          graphql: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: APOLLO_REACT_APOLLO_TEMPLATES.graphql,
                destination: paths.graphql,
                ...options,
              }),
          },
          service: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: APOLLO_REACT_APOLLO_TEMPLATES.service,
                destination: paths.service,
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
