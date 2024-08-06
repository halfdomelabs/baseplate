import {
  ApolloClient,
  HttpLink,
  NormalizedCacheObject,
  from,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { ServerError } from '@apollo/client/link/utils';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLError, Kind } from 'graphql';
import { config } from '../config';
import { logError } from '../error-logger';
import { logger } from '../logger';
import { createApolloCache } from './cache';

export interface ErrorExtensions {
  code?: string;
  statusCode?: number;
  extraData?: Record<string, unknown>;
  reqId?: string;
}

export function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
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
          `[GraphQL Error] Message: ${message}, Path: ${
            path?.join(',') ?? ''
          }, Operation: ${operation.operationName ?? 'Anonymous'}`,
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
  });

  const httpLink = new HttpLink({
    uri: config.VITE_GRAPH_API_ENDPOINT,
  });

  const client = new ApolloClient({
    link: from([errorLink, httpLink]),
    cache: createApolloCache(),
  });

  return client;
}
