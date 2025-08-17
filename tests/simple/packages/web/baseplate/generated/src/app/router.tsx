import type { ErrorRouteComponent } from '@tanstack/react-router';

import { useApolloClient } from '@apollo/client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { useEffect, useMemo, useRef } from 'react';

import { Button } from '../components/ui/button';
import { ErrorDisplay } from '../components/ui/error-display';
import { Loader } from '../components/ui/loader';
import { NotFoundCard } from '../components/ui/not-found-card';
import { routeTree } from '../route-tree.gen';
import { logError } from '../services/error-logger';

function ErrorComponent({
  error,
  reset,
}: React.ComponentProps<ErrorRouteComponent>): React.ReactElement {
  return (
    <ErrorDisplay
      error={error}
      actions={<Button onClick={reset}>Reset</Button>}
    />
  );
}

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundCard,
  defaultErrorComponent: ErrorComponent,
  defaultPendingComponent: Loader,
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
