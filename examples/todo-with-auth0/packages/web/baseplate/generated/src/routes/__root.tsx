import type { ApolloClient } from '@apollo/client';
import type { Auth0ContextInterface } from '@auth0/auth0-react';

import { createRootRouteWithContext } from '@tanstack/react-router';

import type { SessionData } from '../hooks/use-session';

export interface RootRouteContext {
  /* TPL_ROOT_ROUTE_CONTEXT:START */
  apolloClient: ApolloClient<object>;
  auth0: Auth0ContextInterface;
  session: SessionData;
  userId?: string | undefined;
  /* TPL_ROOT_ROUTE_CONTEXT:END */
}

export const Route = createRootRouteWithContext<RootRouteContext>()(
  /* TPL_ROOT_ROUTE_OPTIONS:START */ {} /* TPL_ROOT_ROUTE_OPTIONS:END */,
);
