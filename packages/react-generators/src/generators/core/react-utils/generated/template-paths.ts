import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactUtilsPaths {
  safeLocalStorage: string;
}

const coreReactUtilsPaths = createProviderType<CoreReactUtilsPaths>(
  'core-react-utils-paths',
);

const coreReactUtilsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreReactUtilsPaths: coreReactUtilsPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactUtilsPaths: {
          safeLocalStorage: `${srcRoot}/utils/safe-local-storage.ts`,
        },
      },
    };
  },
});

export const CORE_REACT_UTILS_PATHS = {
  provider: coreReactUtilsPaths,
  task: coreReactUtilsPathsTask,
};
