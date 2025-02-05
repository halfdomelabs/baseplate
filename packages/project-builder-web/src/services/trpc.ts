import type { AppRouter } from '@halfdomelabs/project-builder-server';
import type { TRPCLink } from '@trpc/client';
import type { Unsubscribable } from '@trpc/server/observable';

import { createTypedEventEmitter } from '@halfdomelabs/utils';
import {
  createTRPCProxyClient,
  createWSClient,
  httpBatchLink,
  splitLink,
  TRPCClientError,
  wsLink,
} from '@trpc/client';
import { observable } from '@trpc/server/observable';
import axios, { isAxiosError } from 'axios';

let csrfToken: string | undefined;

/**
 * Checks if an error is a TRPCClientError.
 *
 * @param cause - The error to check.
 * @returns Whether the error is a TRPCClientError.
 */
export function isTRPCClientError(
  cause: unknown,
): cause is TRPCClientError<AppRouter> {
  return cause instanceof TRPCClientError;
}

/**
 * Gets the CSRF token from the server.
 *
 * @param options - The options for the CSRF token.
 * @param options.skipCache - Whether to skip the cache and force a new token to be fetched.
 * @returns The CSRF token.
 */
async function getCsrfToken(options?: { skipCache: boolean }): Promise<string> {
  if (!csrfToken || options?.skipCache) {
    const result = await axios.get<{ csrfToken: string }>('/api/auth');
    csrfToken = result.data.csrfToken;
  }
  return csrfToken;
}

/**
 * Retries a request if it fails every 500ms until the maximum number of attempts is reached.
 *
 * @param maxAttempts - The maximum number of attempts to retry the request.
 * @returns A TRPC link that retries requests.
 */
function retryLink({
  maxAttempts = 3,
}: {
  maxAttempts?: number;
}): TRPCLink<AppRouter> {
  // initialized config
  return () =>
    // initialized in app
    ({ op, next }) =>
      // initialized for request
      observable((observer) => {
        let next$: Unsubscribable | null = null;
        let attemptsLeft = maxAttempts;
        let isDone = false;

        function attempt(): void {
          next$?.unsubscribe();
          next$ = next(op).subscribe({
            error(err) {
              if (
                err.data?.code === 'FORBIDDEN' &&
                err.message === 'Invalid CSRF token' &&
                attemptsLeft !== 0
              ) {
                csrfToken = undefined;
                attemptsLeft--;
                attempt();
              } else if (
                isAxiosError(err.cause) &&
                err.cause.response?.status === 500 &&
                attemptsLeft !== 0
              ) {
                attemptsLeft--;
                // retry after 500ms since server might be starting up (when in development)
                setTimeout(attempt, 500);
              } else {
                observer.error(err);
              }
            },
            next(result) {
              observer.next(result);
            },
            complete() {
              if (isDone) {
                observer.complete();
              }
            },
          });
        }
        attempt();

        return () => {
          isDone = true;
          next$?.unsubscribe();
        };
      });
}

/**
 * Attaches the CSRF token to the payload of an operation.
 *
 * @returns A TRPC link that attaches the CSRF token to the payload of an operation.
 */
function attachCsrfToken(): TRPCLink<AppRouter> {
  // initialized config
  return () =>
    // initialized in app
    ({ op, next }) =>
      // initialized for request
      observable((observer) => {
        let unsubscribed = false;
        let unsubscribe: Unsubscribable = {
          unsubscribe: () => {
            unsubscribed = true;
          },
        };
        getCsrfToken()
          .then(() => {
            if (unsubscribed) {
              return;
            }
            if (typeof op.input === 'object') {
              (op.input as Record<string, unknown>).csrfToken = csrfToken;
            }
            unsubscribe = next(op).subscribe({
              next(value) {
                observer.next(value);
              },
              error(err) {
                observer.error(err);
              },
              complete() {
                observer.complete();
              },
            });
          })
          .catch((error: unknown) => {
            observer.error(
              new TRPCClientError('Failed to get CSRF token', {
                cause: error as Error,
              }),
            );
          });
        return unsubscribe;
      });
}

/**
 * Emits events when the TRPC websocket connection is opened.
 */
export const trpcWebsocketEvents = createTypedEventEmitter<{
  open: undefined;
}>();

const wsClient = createWSClient({
  onOpen() {
    trpcWebsocketEvents.emit('open', undefined);
  },
  url: () => {
    const domain = globalThis.location.origin;
    return `${domain.replace(/^http/, 'ws')}/trpc`;
  },
});

/**
 * The TRPC client.
 */
export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    splitLink({
      condition(op) {
        return op.type === 'subscription';
      },
      // when condition is true, use normal request
      true: [retryLink({}), attachCsrfToken(), wsLink({ client: wsClient })],
      // when condition is false, use batching
      false: [
        retryLink({ maxAttempts: 3 }),
        httpBatchLink({
          url: `/trpc`,
          async headers() {
            return {
              'x-csrf-token': await getCsrfToken(),
            };
          },
        }),
      ],
    }),
  ],
});
