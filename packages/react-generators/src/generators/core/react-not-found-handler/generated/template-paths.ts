import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactRoutesProvider } from '#src/providers/routes.js';

export interface CoreReactNotFoundHandlerPaths {
  notFoundPage: string;
}

const coreReactNotFoundHandlerPaths =
  createProviderType<CoreReactNotFoundHandlerPaths>(
    'core-react-not-found-handler-paths',
  );

const coreReactNotFoundHandlerPathsTask = createGeneratorTask({
  dependencies: { reactRoutes: reactRoutesProvider },
  exports: {
    coreReactNotFoundHandlerPaths: coreReactNotFoundHandlerPaths.export(),
  },
  run({ reactRoutes }) {
    const routesRoot = reactRoutes.getDirectoryBase();

    return {
      providers: {
        coreReactNotFoundHandlerPaths: {
          notFoundPage: `${routesRoot}/NotFound.page.tsx`,
        },
      },
    };
  },
});

export const CORE_REACT_NOT_FOUND_HANDLER_PATHS = {
  provider: coreReactNotFoundHandlerPaths,
  task: coreReactNotFoundHandlerPathsTask,
};
