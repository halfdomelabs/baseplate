import { createRouter } from '@tanstack/react-router';

import { Loader } from '../components/ui/loader';
import { NotFoundCard } from '../components/ui/not-found-card';
import { routeTree } from '../route-tree.gen';
import { ErrorComponent } from './route-error-component';

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundCard,
  defaultErrorComponent: ErrorComponent,
  defaultPendingComponent: Loader,
  /* TPL_ADDITIONAL_ROUTER_OPTIONS:START */ context: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- context instantiated in the RouteProvider
    apolloClient: undefined!,
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
