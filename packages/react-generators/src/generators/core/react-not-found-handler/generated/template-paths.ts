import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactNotFoundHandlerPaths {
  notFoundPage: string;
}

const coreReactNotFoundHandlerPaths =
  createProviderType<CoreReactNotFoundHandlerPaths>(
    'core-react-not-found-handler-paths',
  );

const coreReactNotFoundHandlerPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    coreReactNotFoundHandlerPaths: coreReactNotFoundHandlerPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactNotFoundHandlerPaths: {
          notFoundPage: `${srcRoot}/pages/NotFound.page.tsx`,
        },
      },
    };
  },
});

export const CORE_REACT_NOT_FOUND_HANDLER_PATHS = {
  provider: coreReactNotFoundHandlerPaths,
  task: coreReactNotFoundHandlerPathsTask,
};
