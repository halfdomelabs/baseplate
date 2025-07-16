import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';
import { reactSentryImportsProvider } from '#src/generators/core/react-sentry/generated/ts-import-providers.js';

import { APOLLO_APOLLO_SENTRY_PATHS } from './template-paths.js';
import { APOLLO_APOLLO_SENTRY_TEMPLATES } from './typed-templates.js';

export interface ApolloApolloSentryRenderers {
  apolloSentryLink: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof APOLLO_APOLLO_SENTRY_TEMPLATES.apolloSentryLink
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const apolloApolloSentryRenderers =
  createProviderType<ApolloApolloSentryRenderers>(
    'apollo-apollo-sentry-renderers',
  );

const apolloApolloSentryRenderersTask = createGeneratorTask({
  dependencies: {
    paths: APOLLO_APOLLO_SENTRY_PATHS.provider,
    reactErrorImports: reactErrorImportsProvider,
    reactSentryImports: reactSentryImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    apolloApolloSentryRenderers: apolloApolloSentryRenderers.export(),
  },
  run({ paths, reactErrorImports, reactSentryImports, typescriptFile }) {
    return {
      providers: {
        apolloApolloSentryRenderers: {
          apolloSentryLink: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: APOLLO_APOLLO_SENTRY_TEMPLATES.apolloSentryLink,
                destination: paths.apolloSentryLink,
                importMapProviders: {
                  reactErrorImports,
                  reactSentryImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const APOLLO_APOLLO_SENTRY_RENDERERS = {
  provider: apolloApolloSentryRenderers,
  task: apolloApolloSentryRenderersTask,
};
