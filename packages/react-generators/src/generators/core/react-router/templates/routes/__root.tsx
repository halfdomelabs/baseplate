// @ts-nocheck

import { createRootRouteWithContext } from '@tanstack/react-router';

export interface RootRouteContext {
  TPL_ROOT_ROUTE_CONTEXT;
}

export const Route = createRootRouteWithContext<RootRouteContext>()(
  TPL_ROOT_ROUTE_OPTIONS,
);
