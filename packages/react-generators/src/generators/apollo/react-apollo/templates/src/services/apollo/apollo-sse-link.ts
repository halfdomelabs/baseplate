// @ts-nocheck

import { config } from '%reactConfigImports';
import { ApolloLink } from '@apollo/client';
import { Observable } from '@apollo/client/utilities';
import { print } from 'graphql';
import { createClient } from 'graphql-sse';

/**
 * `graphql-sse` client for GraphQL subscriptions over Server-Sent Events
 * (distinct connections mode, matching GraphQL Yoga's built-in SSE handler).
 *
 * Auth uses the session cookie (`credentials: 'same-origin'`), like the HTTP
 * link — no bearer token needed.
 */
const sseClient = createClient({
  url: config.VITE_GRAPH_API_ENDPOINT,
  credentials: 'same-origin',
  // Retry effectively forever with capped exponential backoff + jitter so
  // subscriptions resume after a dropped connection or backend restart.
  retryAttempts: 86_400,
  retry: async (retries) => {
    await new Promise((resolve) => {
      const cappedExponentialBackoff = Math.min(2 ** retries * 1000, 30 * 1000);
      const randomDelay = Math.random() * 3000;
      setTimeout(resolve, cappedExponentialBackoff + randomDelay);
    });
  },
});

/**
 * Apollo link that routes subscription operations through {@link sseClient}.
 */
export const apolloSseLink = new ApolloLink(
  (operation) =>
    new Observable((observer) =>
      sseClient.subscribe<Record<string, unknown>, Record<string, unknown>>(
        {
          operationName: operation.operationName,
          query: print(operation.query),
          variables: operation.variables,
          extensions: operation.extensions,
        },
        {
          next: (result) => {
            observer.next(result);
          },
          error: (error) => {
            observer.error(error);
          },
          complete: () => {
            observer.complete();
          },
        },
      ),
    ),
);
