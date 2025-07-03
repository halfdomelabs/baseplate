import type { ErrorRouteComponent } from '@tanstack/react-router';

import { Button, ErrorDisplay } from '@baseplate-dev/ui-components';
import { createRouter } from '@tanstack/react-router';

import { NotFoundCard } from './components/index.js';
import { routeTree } from './route-tree.gen.js';

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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we instantiate the context in the RouteProvider
  context: { projectDefinition: undefined! },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
