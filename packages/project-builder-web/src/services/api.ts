import type { AppRouter } from '@halfdomelabs/project-builder-server';
import {
  TRPCClientError,
  TRPCLink,
  createTRPCProxyClient,
  createWSClient,
  httpBatchLink,
  splitLink,
  wsLink,
} from '@trpc/client';
import { Unsubscribable, observable } from '@trpc/server/observable';
import axios, { isAxiosError } from 'axios';

import { createTypedEventEmitter } from '@src/utils/typed-event-emitter';

const URL_BASE = undefined;

let csrfToken: string | undefined;

async function getCsrfToken(options?: { skipCache: boolean }): Promise<string> {
  if (!csrfToken || options?.skipCache) {
    const result = await axios.get<{ csrfToken: string }>('/api/auth');
    csrfToken = result.data.csrfToken;
  }
  return csrfToken;
}

export function retryLink({
  maxAttempts,
}: {
  maxAttempts?: number;
}): TRPCLink<AppRouter> {
  // initialized config
  return () => {
    // initialized in app
    return ({ op, next }) => {
      // initialized for request
      return observable((observer) => {
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
                if (attemptsLeft !== undefined) {
                  attemptsLeft--;
                }
                attempt();
              } else if (
                isAxiosError(err.cause) &&
                err.cause.response?.status === 500 &&
                attemptsLeft !== 0
              ) {
                if (attemptsLeft !== undefined) {
                  attemptsLeft--;
                }
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
    };
  };
}

// Attaches CSRF token to payload of operation
export function attachCsrfToken(): TRPCLink<AppRouter> {
  // initialized config
  return () => {
    // initialized in app
    return ({ op, next }) => {
      // initialized for request
      return observable((observer) => {
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
          .catch((err) => {
            observer.error(
              new TRPCClientError('Failed to get CSRF token', {
                cause: err as Error,
              }),
            );
          });
        return unsubscribe;
      });
    };
  };
}

export const websocketEvents = createTypedEventEmitter<{ open: void }>();

const wsClient = createWSClient({
  onOpen() {
    websocketEvents.emit('open', undefined);
  },
  url: () => {
    const domain = window.location.origin;
    return `${(URL_BASE ?? domain).replace(/^http/, 'ws')}/trpc`;
  },
});

export const client = createTRPCProxyClient<AppRouter>({
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
          url: `${URL_BASE ?? ''}/trpc`,
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
