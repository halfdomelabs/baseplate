import type { ErrorRouteComponent } from '@tanstack/react-router';

import { useApolloClient } from '@apollo/client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { useEffect, useMemo, useRef } from 'react';

import { Button } from '../components/ui/button/button';
import { ErrorDisplay } from '../components/ui/error-display/error-display';
import { NotFoundCard } from '../components/ui/not-found-card/not-found-card';
import { routeTree } from '../route-tree.gen';
import { logError } from '../services/error-logger';

const ErrorComponent: ErrorRouteComponent = ({
  error,
  reset,
}: React.ComponentProps<ErrorRouteComponent>) => (
  <ErrorDisplay
    error={error}
    actions={<Button onClick={reset}>Reset</Button>}
  />
);

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundCard,
  defaultErrorComponent: ErrorComponent,
  context: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- context instantiated in the RouteProvider
    apolloClient: undefined!,
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRoutes(): React.ReactElement {
  const apolloClient = useApolloClient();

  const routerContext = useMemo(() => ({ apolloClient }), [apolloClient]);

  // Ensure we always have the latest context in the router
  const previousContext = useRef<typeof routerContext>(undefined);
  useEffect(() => {
    if (previousContext.current && previousContext.current !== routerContext) {
      router.invalidate().catch(logError);
    }
    previousContext.current = routerContext;
  }, [routerContext]);

  return <RouterProvider router={router} context={routerContext} />;
}
