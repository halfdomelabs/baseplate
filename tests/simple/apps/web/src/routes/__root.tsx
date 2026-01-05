import type { ApolloClient } from '@apollo/client';
import type { PreloadQueryFunction } from '@apollo/client/react';

import { createRootRouteWithContext } from '@tanstack/react-router';

export interface RootRouteContext {
  apolloClient: ApolloClient;
  preloadQuery: PreloadQueryFunction;
}

export const Route = createRootRouteWithContext<RootRouteContext>()({});
