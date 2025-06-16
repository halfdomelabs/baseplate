import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactErrorPaths {
  errorFormatter: string;
  errorLogger: string;
}

const coreReactErrorPaths = createProviderType<CoreReactErrorPaths>(
  'core-react-error-paths',
);

const coreReactErrorPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreReactErrorPaths: coreReactErrorPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactErrorPaths: {
          errorFormatter: `${srcRoot}/services/error-formatter.ts`,
          errorLogger: `${srcRoot}/services/error-logger.ts`,
        },
      },
    };
  },
});

export const CORE_REACT_ERROR_PATHS = {
  provider: coreReactErrorPaths,
  task: coreReactErrorPathsTask,
};
