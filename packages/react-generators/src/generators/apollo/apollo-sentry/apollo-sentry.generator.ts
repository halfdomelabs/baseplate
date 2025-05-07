import {
  tsCodeFragment,
  tsHoistedFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactErrorImportsProvider } from '@src/generators/core/index.js';
import {
  reactSentryConfigProvider,
  reactSentryImportsProvider,
} from '@src/generators/core/react-sentry/react-sentry.generator.js';

import { apolloErrorLinkProvider } from '../apollo-error-link/apollo-error-link.generator.js';
import { reactApolloConfigProvider } from '../react-apollo/react-apollo.generator.js';
import { APOLLO_APOLLO_SENTRY_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

const apolloSentryLinkPath = '@/src/services/apollo/apollo-sentry-link.ts';

export const apolloSentryGenerator = createGenerator({
  name: 'apollo/apollo-sentry',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        reactSentryConfig: reactSentryConfigProvider,
      },
      run({ reactSentryConfig }) {
        const headerFragment = tsCodeFragment(
          `
          function configureSentryScopeForGraphqlError(
            scope: Sentry.Scope,
            error: GraphQLError,
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
              scope.setTag('path', String(error.path?.join('.')));
            }
          }
          `,
          tsImportBuilder(['GraphQLError']).from('graphql'),
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
                  hoistedFragments: [
                    tsHoistedFragment(
                      'apollo-sentry-scope-action',
                      headerFragment,
                    ),
                  ],
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
      },
      run({ reactApolloConfig, apolloErrorLink }) {
        reactApolloConfig.apolloLinks.add({
          name: 'apolloSentryLink',
          nameImport: tsImportBuilder(['apolloSentryLink']).from(
            apolloSentryLinkPath,
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
      },
      run({ typescriptFile, reactSentryImports, reactErrorImports }) {
        return {
          async build(builder) {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: APOLLO_APOLLO_SENTRY_TS_TEMPLATES.apolloSentryLink,
                destination: apolloSentryLinkPath,
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
