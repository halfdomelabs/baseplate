// @ts-nocheck

import type { ErrorRouteComponent } from '@tanstack/react-router';

import { routeTree } from '$routeTree';
import { Button, ErrorDisplay, NotFoundCard } from '%reactComponentsImports';
import { createRouter } from '@tanstack/react-router';

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
  TPL_ADDITIONAL_ROUTER_OPTIONS,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRoutes(): React.ReactElement {
  TPL_COMPONENT_SETUP;

  TPL_ROUTER_CONTEXT;

  TPL_COMPONENT_BODY;

  return TPL_ROUTER_PROVIDER;
}
