import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactRouterPaths {
  index: string;
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
        coreReactRouterPaths: { index: `${srcRoot}/pages/index.tsx` },
      },
    };
  },
});

export const CORE_REACT_ROUTER_PATHS = {
  provider: coreReactRouterPaths,
  task: coreReactRouterPathsTask,
};
