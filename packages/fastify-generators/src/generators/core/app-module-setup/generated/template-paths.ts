import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreAppModuleSetupPaths {
  appModules: string;
}

const coreAppModuleSetupPaths = createProviderType<CoreAppModuleSetupPaths>(
  'core-app-module-setup-paths',
);

const coreAppModuleSetupPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreAppModuleSetupPaths: coreAppModuleSetupPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreAppModuleSetupPaths: {
          appModules: `${srcRoot}/utils/app-modules.ts`,
        },
      },
    };
  },
});

export const CORE_APP_MODULE_SETUP_PATHS = {
  provider: coreAppModuleSetupPaths,
  task: coreAppModuleSetupPathsTask,
};
