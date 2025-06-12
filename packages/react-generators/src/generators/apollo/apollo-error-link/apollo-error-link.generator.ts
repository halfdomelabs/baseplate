import {
  projectScope,
  tsCodeFragment,
  tsHoistedFragment,
  tsImportBuilder,
  tsTypeImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { reactErrorImportsProvider } from '#src/generators/core/react-error/index.js';
import { reactLoggerImportsProvider } from '#src/generators/core/react-logger/index.js';

import { reactApolloConfigProvider } from '../react-apollo/index.js';

const descriptorSchema = z.object({});

export const apolloErrorLinkProvider = createReadOnlyProviderType<{
  errorLinkName: string;
}>('apollo-error-link');

export const apolloErrorLinkGenerator = createGenerator({
  name: 'apollo/apollo-error-link',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        reactApolloConfig: reactApolloConfigProvider,
        reactErrorImports: reactErrorImportsProvider,
        reactLoggerImports: reactLoggerImportsProvider,
      },
      exports: {
        apolloErrorLink: apolloErrorLinkProvider.export(projectScope),
      },
      run({ reactApolloConfig, reactErrorImports, reactLoggerImports }) {
        reactApolloConfig.apolloLinks.add({
          name: 'errorLink',
          priority: 'error',
          bodyFragment: tsCodeFragment(
            `const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
          // log query/subscription errors but not mutations since it should be handled by caller
          const definition = getMainDefinition(operation.query);
          const shouldLogErrors =
            definition.kind === Kind.OPERATION_DEFINITION &&
            ['query', 'subscription'].includes(definition.operation);
      
          if (!shouldLogErrors) {
            return;
          }
      
          if (graphQLErrors?.length) {
            for (const error of graphQLErrors) {
              const { message, path } = error;
              logger.error(
                \`[GraphQL Error] Message: \${message}, Path: \${
                  path?.join(',') ?? ''
                }, Operation: \${operation.operationName ? operation.operationName : 'Anonymous'}\`,
              );
            }
      
            // we just record the first error (usually only one) in order to avoid over-reporting
            // e.g. if a sub-resolver fails for each item in a large array
            const graphQLError = graphQLErrors[0];
            logError(new GraphQLError(graphQLError.message, graphQLError));
          }
      
          if (networkError) {
            if ((networkError as ServerError).statusCode) {
              // report and log network errors with a status code
              // we don't care about connection errors, e.g. client doesn't have internet
              logError(networkError);
            } else {
              // otherwise just log but don't report network error
              logger.error(networkError);
            }
          }
        });`,
            [
              reactErrorImports.logError.declaration(),
              reactLoggerImports.logger.declaration(),
              tsImportBuilder(['onError']).from('@apollo/client/link/error'),
              tsImportBuilder(['getMainDefinition']).from(
                '@apollo/client/utilities',
              ),
              tsImportBuilder(['GraphQLError', 'Kind']).from('graphql'),
              tsTypeImportBuilder(['ServerError']).from(
                '@apollo/client/link/utils',
              ),
            ],
            {
              hoistedFragments: [
                tsHoistedFragment(
                  'error-extensions',
                  `export interface ErrorExtensions {
  code?: string;
  statusCode?: number;
  extraData?: Record<string, unknown>;
  reqId?: string;
}`,
                ),
              ],
            },
          ),
        });
        return {
          providers: {
            apolloErrorLink: {
              errorLinkName: 'errorLink',
            },
          },
        };
      },
    }),
  }),
});
