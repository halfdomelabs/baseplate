import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactConfigPaths {
  config: string;
}

const coreReactConfigPaths = createProviderType<CoreReactConfigPaths>(
  'core-react-config-paths',
);

const coreReactConfigPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreReactConfigPaths: coreReactConfigPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactConfigPaths: { config: `${srcRoot}/services/config.ts` },
      },
    };
  },
});

export const CORE_REACT_CONFIG_PATHS = {
  provider: coreReactConfigPaths,
  task: coreReactConfigPathsTask,
};
