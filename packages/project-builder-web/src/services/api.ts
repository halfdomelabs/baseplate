import type { AppRouter } from '@halfdomelabs/project-builder-server';
import { TRPCLink, createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import axios from 'axios';

const URL_BASE = undefined;

let csrfToken: string | undefined;

async function getCsrfToken(): Promise<string> {
  if (!csrfToken) {
    const result = await axios.get<{ csrfToken: string }>('/api/auth');
    csrfToken = result.data.csrfToken;
  }
  return csrfToken;
}

export function retryLink(): TRPCLink<AppRouter> {
  // initialized config
  return () => {
    // initialized in app
    return ({ op, next }) => {
      // initialized for request
      let hasRetried = false;
      return observable((observer) => {
        const unsubscribe = next(op).subscribe({
          next(value) {
            observer.next(value);
          },
          error(err) {
            if (
              err.data?.code === 'FORBIDDEN' &&
              err.message === 'Invalid CSRF token' &&
              !hasRetried
            ) {
              csrfToken = undefined;
              hasRetried = true;
              unsubscribe.unsubscribe();
              next(op).subscribe(observer);
            } else {
              observer.error(err);
            }
          },
          complete() {
            observer.complete();
          },
        });
        return unsubscribe;
      });
    };
  };
}

export const client = createTRPCProxyClient<AppRouter>({
  links: [
    retryLink(),
    httpBatchLink({
      url: `${URL_BASE ?? ''}/trpc`,
      async headers() {
        return {
          'x-csrf-token': await getCsrfToken(),
        };
      },
    }),
  ],
});
