import type { ErrorRouteComponent } from '@tanstack/react-router';

import { createRouter, RouterProvider } from '@tanstack/react-router';

import { Button, ErrorDisplay, NotFoundCard } from '../components';
import { routeTree } from '../route-tree.gen';

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
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRoutes(): React.ReactElement {
  return <RouterProvider router={router} />;
}
