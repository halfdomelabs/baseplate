// @ts-nocheck

import { ErrorComponent } from '$routeErrorComponent';
import { routeTree } from '$routeTree';
import { Loader, NotFoundCard } from '%reactComponentsImports';
import { createRouter } from '@tanstack/react-router';

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundCard,
  defaultErrorComponent: ErrorComponent,
  defaultPendingComponent: Loader,
  TPL_ADDITIONAL_ROUTER_OPTIONS,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
