import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreConfigServicePaths {
  config: string;
}

const coreConfigServicePaths = createProviderType<CoreConfigServicePaths>(
  'core-config-service-paths',
);

const coreConfigServicePathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreConfigServicePaths: coreConfigServicePaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreConfigServicePaths: { config: `${srcRoot}/services/config.ts` },
      },
    };
  },
});

export const CORE_CONFIG_SERVICE_PATHS = {
  provider: coreConfigServicePaths,
  task: coreConfigServicePathsTask,
};
