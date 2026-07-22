import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreAppRuntimePaths {
  appRuntime: string;
  runtimeServices: string;
}

const coreAppRuntimePaths = createProviderType<CoreAppRuntimePaths>(
  'core-app-runtime-paths',
);

const coreAppRuntimePathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreAppRuntimePaths: coreAppRuntimePaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreAppRuntimePaths: {
          appRuntime: `${srcRoot}/utils/app-runtime.ts`,
          runtimeServices: `${srcRoot}/utils/runtime-services.ts`,
        },
      },
    };
  },
});

export const CORE_APP_RUNTIME_PATHS = {
  provider: coreAppRuntimePaths,
  task: coreAppRuntimePathsTask,
};
