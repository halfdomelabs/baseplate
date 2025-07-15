import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactPathsProvider } from '#src/providers/react-paths.js';

export interface CoreReactErrorBoundaryPaths {
  component: string;
}

const coreReactErrorBoundaryPaths =
  createProviderType<CoreReactErrorBoundaryPaths>(
    'core-react-error-boundary-paths',
  );

const coreReactErrorBoundaryPathsTask = createGeneratorTask({
  dependencies: { reactPaths: reactPathsProvider },
  exports: {
    coreReactErrorBoundaryPaths: coreReactErrorBoundaryPaths.export(),
  },
  run({ reactPaths }) {
    const componentsRoot = reactPaths.getComponentsFolder();

    return {
      providers: {
        coreReactErrorBoundaryPaths: {
          component: `${componentsRoot}/error-boundary/error-boundary.tsx`,
        },
      },
    };
  },
});

export const CORE_REACT_ERROR_BOUNDARY_PATHS = {
  provider: coreReactErrorBoundaryPaths,
  task: coreReactErrorBoundaryPathsTask,
};
