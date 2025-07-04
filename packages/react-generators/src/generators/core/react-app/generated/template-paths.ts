import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactAppPaths {
  app: string;
}

const coreReactAppPaths = createProviderType<CoreReactAppPaths>(
  'core-react-app-paths',
);

const coreReactAppPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreReactAppPaths: coreReactAppPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactAppPaths: { app: `${srcRoot}/app/app.tsx` },
      },
    };
  },
});

export const CORE_REACT_APP_PATHS = {
  provider: coreReactAppPaths,
  task: coreReactAppPathsTask,
};
