import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactErrorProvider } from '@src/generators/core/react-error/react-error.generator.js';
import { reactLoggerProvider } from '@src/generators/core/react-logger/react-logger.generator.js';
import { reactApolloSetupProvider } from '../react-apollo/react-apollo.generator.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export const apolloErrorLinkGenerator = createGenerator({
  name: 'apollo/apollo-error-link',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        reactApolloSetup: reactApolloSetupProvider,
        reactError: reactErrorProvider,
        reactLogger: reactLoggerProvider,
      },
      run({ reactApolloSetup, reactError, reactLogger }) {
        reactApolloSetup.addLink({
          name: 'errorLink',
          bodyExpression: TypescriptCodeUtils.createBlock(
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
            graphQLErrors.forEach((error) => {
              const { message, path } = error;
              logger.error(
                \`[GraphQL Error] Message: \${message}, Path: \${
                  path?.join(',') ?? ''
                }, Operation: \${operation.operationName ?? 'Anonymous'}\`
              );
            });
      
            // we just record the first error (usually only one) in order to avoid over-reporting
            // e.g. if a sub-resolver fails for each item in a large array
            const graphQLError = graphQLErrors[0];
            logError(new GraphQLError(graphQLError.message, graphQLError));
          }
      
          if (networkError) {
            if ((networkError as ServerError)?.statusCode) {
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
              'import { logError } from "%react-error/logger"',
              'import { logger } from "%react-logger"',
              'import { onError } from "@apollo/client/link/error"',
              'import { getMainDefinition } from "@apollo/client/utilities"',
              'import { GraphQLError, Kind } from "graphql";',
              'import { ServerError } from "@apollo/client/link/utils";',
            ],
            {
              importMappers: [reactError, reactLogger],
              headerBlocks: [
                TypescriptCodeUtils.createBlock(
                  `export interface ErrorExtensions {
  code?: string;
  statusCode?: number;
  extraData?: Record<string, unknown>;
  reqId?: string;
}`,
                  undefined,
                  { headerKey: 'ErrorExtensions' },
                ),
              ],
            },
          ),
        });
        return {};
      },
    }),
  }),
});
