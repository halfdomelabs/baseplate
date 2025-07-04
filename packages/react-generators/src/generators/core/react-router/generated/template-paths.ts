import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactRouterPaths {
  appRoutes: string;
  index: string;
  routeTree: string;
}

const coreReactRouterPaths = createProviderType<CoreReactRouterPaths>(
  'core-react-router-paths',
);

const coreReactRouterPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreReactRouterPaths: coreReactRouterPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactRouterPaths: {
          appRoutes: `${srcRoot}/app/app-routes.tsx`,
          index: `${srcRoot}/pages/index.tsx`,
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
