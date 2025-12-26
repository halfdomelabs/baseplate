import { ApolloClient, ApolloLink, HttpLink } from '@apollo/client';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLError, Kind } from 'graphql';

import { config } from '../config';
import { logError } from '../error-logger';
import { logger } from '../logger';
import { userSessionClient } from '../user-session-client';
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

  const sessionErrorLink = new ErrorLink(({ error }) => {
    if (ServerError.is(error) && error.statusCode === 401) {
      // Try to parse the body as JSON to check for invalid-session
      try {
        const body = JSON.parse(error.bodyText) as { code?: string };
        if (body.code === 'invalid-session') {
          userSessionClient.signOut();
        }
      } catch {
        // Body is not JSON, ignore
      }
    }
    return;
  });

  const httpLink = new HttpLink({
    uri: config.VITE_GRAPH_API_ENDPOINT,
  });
  /* TPL_LINK_BODIES:END */
  const client = new ApolloClient({
    link: ApolloLink.from(
      /* TPL_LINKS:START */ [
        errorLink,
        apolloSentryLink,
        sessionErrorLink,
        httpLink,
      ] /* TPL_LINKS:END */,
    ),
    cache: createApolloCache(),
  });

  return client;
}
