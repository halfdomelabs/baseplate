import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactRoutesProvider } from '#src/providers/routes.js';

export interface CoreReactRouterPaths {
  placeholderIndex: string;
  rootRoute: string;
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
          placeholderIndex: `${routesRoot}/index.tsx`,
          rootRoute: `${routesRoot}/__root.tsx`,
          router: `${srcRoot}/app/router.tsx`,
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
