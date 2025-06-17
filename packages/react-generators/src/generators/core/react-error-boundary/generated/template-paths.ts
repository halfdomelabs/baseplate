import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactErrorBoundaryPaths {
  component: string;
}

const coreReactErrorBoundaryPaths =
  createProviderType<CoreReactErrorBoundaryPaths>(
    'core-react-error-boundary-paths',
  );

const coreReactErrorBoundaryPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    coreReactErrorBoundaryPaths: coreReactErrorBoundaryPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactErrorBoundaryPaths: {
          component: `${srcRoot}/components/ErrorBoundary/index.tsx`,
        },
      },
    };
  },
});

export const CORE_REACT_ERROR_BOUNDARY_PATHS = {
  provider: coreReactErrorBoundaryPaths,
  task: coreReactErrorBoundaryPathsTask,
};
