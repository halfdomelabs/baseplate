import type { AppRouter } from '@baseplate-dev/project-builder-server';
import type { TRPCLink } from '@trpc/client';
import type { Unsubscribable } from '@trpc/server/observable';

import { createTypedEventEmitter } from '@baseplate-dev/utils';
import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  loggerLink,
  splitLink,
  TRPCClientError,
  wsLink,
} from '@trpc/client';
import { observable } from '@trpc/server/observable';

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
 * Retries a request if it fails every 500ms until the maximum number of attempts is reached.
 *
 * @param maxAttempts - The maximum number of attempts to retry the request.
 * @returns A TRPC link that retries requests.
 */
function retryLink({
  maxAttempts = 5,
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
                err.message.includes('Failed to execute') &&
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
 * Emits events when the TRPC SSE connection is opened.
 */
export const trpcSubscriptionEvents = createTypedEventEmitter<{
  open: undefined;
}>();

const wsClient = createWSClient({
  url: `${globalThis.location.origin.replace(/^http/, 'ws')}/trpc`,
  onOpen() {
    trpcSubscriptionEvents.emit('open', undefined);
  },
});

/**
 * The TRPC client.
 */
export const trpc = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: [
        // make sure we log errors on subscriptions which may not be otherwise logged
        loggerLink({
          enabled: (op) =>
            op.direction === 'down' && op.result instanceof Error,
        }),
        retryLink({}),
        wsLink({
          client: wsClient,
        }),
      ],
      false: [
        retryLink({ maxAttempts: 10 }),
        httpBatchLink({
          url: `/trpc`,
        }),
      ],
    }),
  ],
});
