import {
  makeImportAndFilePath,
  tsCodeFragment,
  tsHoistedFragment,
  tsImportBuilder,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactSentryConfigProvider } from '@src/generators/core/react-sentry/react-sentry.generator.js';

import { reactApolloSetupProvider } from '../react-apollo/react-apollo.generator.js';

const descriptorSchema = z.object({});

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
                      headerFragment,
                      'apollo-sentry-scope-action',
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
        reactApolloSetup: reactApolloSetupProvider,
        typescript: typescriptProvider,
      },
      run({ reactApolloSetup, typescript }) {
        const [linkImport, linkPath] = makeImportAndFilePath(
          'src/services/apollo/apollo-sentry-link.ts',
        );
        return {
          async build(builder) {
            await builder.apply(
              typescript.createCopyAction({
                source: 'apollo-sentry-link.ts',
                destination: linkPath,
              }),
            );

            reactApolloSetup.addLink({
              key: 'apolloSentryLink',
              name: TypescriptCodeUtils.createExpression(`apolloSentryLink`, [
                `import { apolloSentryLink } from '${linkImport}'`,
              ]),
              dependencies: [['errorLink', 'apolloSentryLink']],
            });
          },
        };
      },
    }),
  }),
});
