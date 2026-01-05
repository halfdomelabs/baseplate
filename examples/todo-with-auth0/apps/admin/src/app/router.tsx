import type { ErrorRouteComponent } from '@tanstack/react-router';

import { createQueryPreloader, useApolloClient } from '@apollo/client/react';
import { useAuth0 } from '@auth0/auth0-react';
import { createRouter, Link, RouterProvider } from '@tanstack/react-router';
import { useEffect, useMemo, useRef } from 'react';

import { Button } from '../components/ui/button';
import { ErrorDisplay } from '../components/ui/error-display';
import { Loader } from '../components/ui/loader';
import { NotFoundCard } from '../components/ui/not-found-card';
import { useLogOut } from '../hooks/use-log-out';
import { useSession } from '../hooks/use-session';
import { routeTree } from '../route-tree.gen';
import { logError } from '../services/error-logger';
import { identifySentryUser } from '../services/sentry';
import { InvalidRoleError } from '../utils/auth-errors';

function ErrorComponent({
  error,
  reset,
}: React.ComponentProps<ErrorRouteComponent>): React.ReactElement {
  /* TPL_ERROR_COMPONENT_HEADER:START */
  const logout = useLogOut();
  /* TPL_ERROR_COMPONENT_HEADER:END */

  /* TPL_ERROR_COMPONENT_BODY:START */
  if (error instanceof InvalidRoleError) {
    return (
      <ErrorDisplay
        header="Access Denied"
        error="You are not authorized to access this page. Please contact support if you believe this is an error."
        actions={
          <div className="flex gap-2">
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          </div>
        }
      />
    );
  }
  /* TPL_ERROR_COMPONENT_BODY:END */

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
  /* TPL_ADDITIONAL_ROUTER_OPTIONS:START */ context: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- context instantiated in the RouteProvider
    apolloClient: undefined!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- context instantiated in the RouteProvider
    auth0: undefined!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- context instantiated in the RouteProvider
    preloadQuery: undefined!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- context instantiated in the RouteProvider
    session: undefined!,
  } /* TPL_ADDITIONAL_ROUTER_OPTIONS:END */,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRoutes(): React.ReactElement {
  /* TPL_COMPONENT_SETUP:START */
  const apolloClient = useApolloClient();
  const preloadQuery = useMemo(
    () => createQueryPreloader(apolloClient),
    [apolloClient],
  );

  const session = useSession();
  const { userId } = session;

  useEffect(() => {
    if (!userId) return;

    identifySentryUser({
      id: userId,
    });
  }, [userId]);

  const auth0 = useAuth0();
  /* TPL_COMPONENT_SETUP:END */

  /* TPL_ROUTER_CONTEXT:START */
  const routerContext = useMemo(
    () => ({ apolloClient, auth0, preloadQuery, session, userId }),
    [apolloClient, auth0, preloadQuery, session, userId],
  );

  // Ensure we always have the latest context in the router
  const previousContext = useRef<typeof routerContext>(undefined);
  useEffect(() => {
    if (previousContext.current && previousContext.current !== routerContext) {
      router.invalidate().catch(logError);
    }
    previousContext.current = routerContext;
  }, [routerContext]);
  /* TPL_ROUTER_CONTEXT:END */

  /* TPL_COMPONENT_BODY:BLOCK */

  return (
    /* TPL_ROUTER_PROVIDER:START */ <RouterProvider
      router={router}
      context={routerContext}
    /> /* TPL_ROUTER_PROVIDER:END */
  );
}
