import {
  tsCodeFragment,
  tsHoistedFragment,
  tsImportBuilder,
  tsTypeImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { reactErrorImportsProvider } from '#src/generators/core/index.js';
import {
  reactSentryConfigProvider,
  reactSentryImportsProvider,
} from '#src/generators/core/react-sentry/index.js';

import { apolloErrorLinkProvider } from '../apollo-error-link/index.js';
import { reactApolloConfigProvider } from '../react-apollo/index.js';
import { APOLLO_APOLLO_SENTRY_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const apolloSentryGenerator = createGenerator({
  name: 'apollo/apollo-sentry',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: APOLLO_APOLLO_SENTRY_GENERATED.paths.task,
    main: createGeneratorTask({
      dependencies: {
        reactSentryConfig: reactSentryConfigProvider,
        paths: APOLLO_APOLLO_SENTRY_GENERATED.paths.provider,
      },
      run({ reactSentryConfig }) {
        const headerFragment = tsHoistedFragment(
          'configureSentryScopeForGraphqlError',
          `
          function configureSentryScopeForGraphqlError(
            scope: Sentry.Scope,
            error: GraphQLError | GraphQLFormattedError,
          ): void {
            scope.setFingerprint(
              [
                '{{ default }}',
                error.extensions?.code as string,
                error.path?.join('.'),
              ].filter((value): value is string => typeof value === 'string' && !!value),
            );
            if (error.path?.[0]) {
              scope.setTransactionName(String(error.path[0]));
              scope.setTag('path', String(error.path.join('.')));
            }
          }
          `,
          [
            tsImportBuilder(['GraphQLError']).from('graphql'),
            tsTypeImportBuilder(['GraphQLFormattedError']).from('graphql'),
          ],
        );
        return {
          build: () => {
            reactSentryConfig.sentryScopeActions.set(
              'apollo',
              tsCodeFragment(
                `
                if (error instanceof ApolloError && error.graphQLErrors.length === 1) {
                  const graphqlError = error.graphQLErrors[0];
                  configureSentryScopeForGraphqlError(scope, graphqlError);
                }
            
                if (error instanceof GraphQLError) {
                  configureSentryScopeForGraphqlError(scope, error);
                }
            `,
                [
                  tsImportBuilder(['GraphQLError']).from('graphql'),
                  tsImportBuilder(['ApolloError']).from('@apollo/client'),
                ],
                {
                  hoistedFragments: [headerFragment],
                },
              ),
            );
          },
        };
      },
    }),
    apolloSentryLink: createGeneratorTask({
      dependencies: {
        reactApolloConfig: reactApolloConfigProvider,
        apolloErrorLink: apolloErrorLinkProvider,
        paths: APOLLO_APOLLO_SENTRY_GENERATED.paths.provider,
      },
      run({ reactApolloConfig, apolloErrorLink, paths }) {
        reactApolloConfig.apolloLinks.add({
          name: 'apolloSentryLink',
          nameImport: tsImportBuilder(['apolloSentryLink']).from(
            paths.apolloSentryLink,
          ),
          priority: 'error',
          dependencies: [apolloErrorLink.errorLinkName],
        });
      },
    }),
    apolloSentryLinkFile: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactSentryImports: reactSentryImportsProvider,
        reactErrorImports: reactErrorImportsProvider,
        paths: APOLLO_APOLLO_SENTRY_GENERATED.paths.provider,
      },
      run({ typescriptFile, reactSentryImports, reactErrorImports, paths }) {
        return {
          async build(builder) {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  APOLLO_APOLLO_SENTRY_GENERATED.templates.apolloSentryLink,
                destination: paths.apolloSentryLink,
                importMapProviders: {
                  reactSentryImports,
                  reactErrorImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
