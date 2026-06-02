import { ApolloClient, ApolloLink, HttpLink } from '@apollo/client';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLError, Kind, OperationTypeNode } from 'graphql';
import { createClient } from 'graphql-ws';

import { config } from '../config';
import { logError } from '../error-logger';
import { logger } from '../logger';
import { apolloSentryLink } from './apollo-sentry-link';
import { createApolloCache } from './cache';

/* HOISTED:error-extensions:START */
export interface ErrorExtensions {
  code?: string;
  statusCode?: number;
  extraData?: Record<string, unknown>;
  reqId?: string;
}
/* HOISTED:error-extensions:END */

/* HOISTED:get-ws-url:START */
function getWsUrl(): string {
  if (config.VITE_GRAPH_WS_API_ENDPOINT) {
    return config.VITE_GRAPH_WS_API_ENDPOINT;
  }
  // handle case where API endpoint includes domain, e.g. http://localhost/api/graphql
  if (config.VITE_GRAPH_API_ENDPOINT.includes('http')) {
    return config.VITE_GRAPH_API_ENDPOINT.replace('https://', 'wss://').replace(
      'http://',
      'ws://',
    );
  }
  // handle relative API endpoint, e.g. /api/graphql
  const { protocol, host } = globalThis.location;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${host}${config.VITE_GRAPH_API_ENDPOINT}`;
}
/* HOISTED:get-ws-url:END */

export function createApolloClient(/* TPL_CREATE_ARGS:INLINE */): ApolloClient {
  /* TPL_LINK_BODIES:START */
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

  const wsLink = new GraphQLWsLink(
    createClient({
      connectionParams: async () => {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          return {};
        }
        return { authorization: `Bearer ${accessToken}` };
      },
      retryAttempts: 86_400 /* effectively retry forever (1 month of retries) - there's no way of disabling retry attempts */,
      retryWait: async (retries) => {
        await new Promise((resolve) => {
          // use exponential backoff strategy capped at 30 seconds
          const cappedExponentialBackoff = Math.min(
            2 ** retries * 1000,
            30 * 1000,
          );
          // insert a bit of randomness to prevent thundering herd problem
          const randomDelay = Math.random() * 3000;
          setTimeout(resolve, cappedExponentialBackoff + randomDelay);
        });
      },
      shouldRetry: () => true,
      url: getWsUrl(),
    }),
  );

  const splitLink = ApolloLink.split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === Kind.OPERATION_DEFINITION &&
        definition.operation === OperationTypeNode.SUBSCRIPTION
      );
    },
    wsLink,
    httpLink,
  );
  /* TPL_LINK_BODIES:END */
  const client = new ApolloClient({
    link: ApolloLink.from(
      /* TPL_LINKS:START */ [
        errorLink,
        apolloSentryLink,
        splitLink,
      ] /* TPL_LINKS:END */,
    ),
    cache: createApolloCache(),
  });

  return client;
}
