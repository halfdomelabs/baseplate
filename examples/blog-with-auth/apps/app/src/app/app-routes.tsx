import { createQueryPreloader, useApolloClient } from '@apollo/client/react';
import { RouterProvider } from '@tanstack/react-router';
import { useEffect, useMemo, useRef } from 'react';

import { useSession } from '../hooks/use-session';
import { logError } from '../services/error-logger';
import { identifySentryUser } from '../services/sentry';
import { userSessionClient } from '../services/user-session-client';
import { router } from './router';

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

  // RouterProvider only copies the context into the router when it renders, so push
  // the session in as soon as it changes. Otherwise a navigation triggered in the
  // same tick as a sign in or sign out runs its guards against the old session.
  useEffect(
    () =>
      userSessionClient.subscribe(() => {
        const currentSession = userSessionClient.getSession();
        if (!currentSession) return;
        router.update({
          ...router.options,
          context: {
            ...router.options.context,
            session: currentSession,
            userId: currentSession.userId,
          },
        });
      }),
    [],
  );
  /* TPL_COMPONENT_SETUP:END */

  /* TPL_ROUTER_CONTEXT:START */
  const routerContext = useMemo(
    () => ({ apolloClient, preloadQuery, session, userId }),
    [apolloClient, preloadQuery, session, userId],
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
    />
  ); /* TPL_ROUTER_PROVIDER:END */
}
