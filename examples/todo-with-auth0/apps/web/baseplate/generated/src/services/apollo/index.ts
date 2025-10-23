import type { NormalizedCacheObject } from '@apollo/client';
import type { ServerError } from '@apollo/client/link/utils';

import { ApolloClient, from, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLError, Kind } from 'graphql';

import { config } from '../config';
import { logError } from '../error-logger';
import { logger } from '../logger';
import { apolloSentryLink } from './apollo-sentry-link';
import { createApolloCache } from './cache';

/* HOISTED:create-apollo-client-options:START */
interface CreateApolloClientOptions {
  getAccessToken: () => Promise<string | undefined>;
}
/* HOISTED:create-apollo-client-options:END */

/* HOISTED:error-extensions:START */
export interface ErrorExtensions {
  code?: string;
  statusCode?: number;
  extraData?: Record<string, unknown>;
  reqId?: string;
}
/* HOISTED:error-extensions:END */

export function createApolloClient(
  /* TPL_CREATE_ARGS:START */ {
    getAccessToken,
  }: CreateApolloClientOptions /* TPL_CREATE_ARGS:END */,
): ApolloClient<NormalizedCacheObject> {
  /* TPL_LINK_BODIES:START */
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
      for (const error of graphQLErrors) {
        const { message, path } = error;
        logger.error(
          `[GraphQL Error] Message: ${message}, Path: ${
            path?.join(',') ?? ''
          }, Operation: ${operation.operationName ? operation.operationName : 'Anonymous'}`,
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
  });

  const authLink = setContext(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return {};
    }
    return { headers: { authorization: `Bearer ${accessToken}` } };
  });

  const httpLink = new HttpLink({
    uri: config.VITE_GRAPH_API_ENDPOINT,
  });
  /* TPL_LINK_BODIES:END */
  const client = new ApolloClient({
    link: from(
      /* TPL_LINKS:START */ [
        errorLink,
        apolloSentryLink,
        authLink,
        httpLink,
      ] /* TPL_LINKS:END */,
    ),
    cache: createApolloCache(),
  });

  return client;
}
