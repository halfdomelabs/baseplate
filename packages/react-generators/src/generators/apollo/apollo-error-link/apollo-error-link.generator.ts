import {
  packageScope,
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
        apolloErrorLink: apolloErrorLinkProvider.export(packageScope),
      },
      run({ reactApolloConfig, reactErrorImports, reactLoggerImports }) {
        reactApolloConfig.apolloLinks.add({
          name: 'errorLink',
          priority: 'error',
          bodyFragment: tsCodeFragment(
            `const errorLink = new ErrorLink(({ error, operation }) => {
          // log query/subscription errors but not mutations since it should be handled by caller
          const definition = getMainDefinition(operation.query);
          const shouldLogErrors =
            definition.kind === Kind.OPERATION_DEFINITION &&
            ['query', 'subscription'].includes(definition.operation);

          if (!shouldLogErrors) {
            return;
          }

          if (CombinedGraphQLErrors.is(error)) {
            for (const graphQLError of error.errors) {
              const { message, path } = graphQLError;
              logger.error(
                \`[GraphQL Error] Message: \${message}, Path: \${
                  path?.join(',') ?? ''
                }, Operation: \${operation.operationName ? operation.operationName : 'Anonymous'}\`,
              );
            }

            // we just record the first error (usually only one) in order to avoid over-reporting
            // e.g. if a sub-resolver fails for each item in a large array
            const graphQLError = error.errors[0];
            logError(new GraphQLError(graphQLError.message, graphQLError));
          } else if (ServerError.is(error)) {
            // report and log network errors with a status code
            // we don't care about connection errors, e.g. client doesn't have internet
            logError(error);
          } else {
            // otherwise just log but don't report network error
            logger.error(error);
          }
        });`,
            [
              reactErrorImports.logError.declaration(),
              reactLoggerImports.logger.declaration(),
              tsImportBuilder(['ErrorLink']).from('@apollo/client/link/error'),
              tsImportBuilder(['getMainDefinition']).from(
                '@apollo/client/utilities',
              ),
              tsImportBuilder(['GraphQLError', 'Kind']).from('graphql'),
              tsImportBuilder(['CombinedGraphQLErrors', 'ServerError']).from(
                '@apollo/client/errors',
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
