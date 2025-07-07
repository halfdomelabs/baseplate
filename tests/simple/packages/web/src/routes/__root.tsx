import type { ApolloClient } from '@apollo/client';

import { createRootRouteWithContext } from '@tanstack/react-router';

export interface RootRouteContext {
  apolloClient: ApolloClient<object>;
}

export const Route = createRootRouteWithContext<RootRouteContext>()({});
