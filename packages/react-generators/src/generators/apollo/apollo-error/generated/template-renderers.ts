import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { APOLLO_APOLLO_ERROR_PATHS } from './template-paths.js';
import { APOLLO_APOLLO_ERROR_TEMPLATES } from './typed-templates.js';

export interface ApolloApolloErrorRenderers {
  apolloError: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof APOLLO_APOLLO_ERROR_TEMPLATES.apolloError
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const apolloApolloErrorRenderers =
  createProviderType<ApolloApolloErrorRenderers>(
    'apollo-apollo-error-renderers',
  );

const apolloApolloErrorRenderersTask = createGeneratorTask({
  dependencies: {
    paths: APOLLO_APOLLO_ERROR_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { apolloApolloErrorRenderers: apolloApolloErrorRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        apolloApolloErrorRenderers: {
          apolloError: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: APOLLO_APOLLO_ERROR_TEMPLATES.apolloError,
                destination: paths.apolloError,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const APOLLO_APOLLO_ERROR_RENDERERS = {
  provider: apolloApolloErrorRenderers,
  task: apolloApolloErrorRenderersTask,
};
