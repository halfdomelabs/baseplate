import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { appModuleProvider } from '#src/generators/core/app-module/app-module.generator.js';

export interface CoreAppModulePaths {
  index: string;
}

const coreAppModulePaths = createProviderType<CoreAppModulePaths>(
  'core-app-module-paths',
);

const coreAppModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { coreAppModulePaths: coreAppModulePaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        coreAppModulePaths: { index: `${moduleRoot}/index.ts` },
      },
    };
  },
});

export const CORE_APP_MODULE_PATHS = {
  provider: coreAppModulePaths,
  task: coreAppModulePathsTask,
};
