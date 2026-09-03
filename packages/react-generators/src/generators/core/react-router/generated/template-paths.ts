import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactRoutesProvider } from '#src/providers/routes.js';

export interface CoreReactRouterPaths {
  appRoutes: string;
  placeholderIndex: string;
  rootRoute: string;
  routeErrorComponent: string;
  router: string;
  routeTree: string;
}

const coreReactRouterPaths = createProviderType<CoreReactRouterPaths>(
  'core-react-router-paths',
);

const coreReactRouterPathsTask = createGeneratorTask({
  dependencies: {
    packageInfo: packageInfoProvider,
    reactRoutes: reactRoutesProvider,
  },
  exports: { coreReactRouterPaths: coreReactRouterPaths.export() },
  run({ packageInfo, reactRoutes }) {
    const routesRoot = reactRoutes.getOutputRelativePath();
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactRouterPaths: {
          appRoutes: `${srcRoot}/app/app-routes.tsx`,
          placeholderIndex: `${routesRoot}/index.tsx`,
          rootRoute: `${routesRoot}/__root.tsx`,
          routeErrorComponent: `${srcRoot}/app/route-error-component.tsx`,
          router: `${srcRoot}/app/router.ts`,
          routeTree: `${srcRoot}/route-tree.gen.ts`,
        },
      },
    };
  },
});

export const CORE_REACT_ROUTER_PATHS = {
  provider: coreReactRouterPaths,
  task: coreReactRouterPathsTask,
};
