import { ApolloClient, ApolloLink, HttpLink } from '@apollo/client';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLError, Kind } from 'graphql';

import { config } from '../config';
import { logError } from '../error-logger';
import { logger } from '../logger';
import { apolloSentryLink } from './apollo-sentry-link';
import { createApolloCache } from './cache';

export interface ErrorExtensions {
  code?: string;
  statusCode?: number;
  extraData?: Record<string, unknown>;
  reqId?: string;
}

export function createApolloClient(): ApolloClient {
  const errorLink = new ErrorLink(({ error, operation }) => {
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
          `[GraphQL Error] Message: ${message}, Path: ${
            path?.join(',') ?? ''
          }, Operation: ${operation.operationName ? operation.operationName : 'Anonymous'}`,
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
  });

  const httpLink = new HttpLink({
    uri: config.VITE_GRAPH_API_ENDPOINT,
  });
  const client = new ApolloClient({
    link: ApolloLink.from([errorLink, apolloSentryLink, httpLink]),
    cache: createApolloCache(),
  });

  return client;
}
