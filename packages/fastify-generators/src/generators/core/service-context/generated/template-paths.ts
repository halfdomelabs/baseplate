import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreServiceContextPaths {
  serviceContext: string;
  testHelper: string;
}

const coreServiceContextPaths = createProviderType<CoreServiceContextPaths>(
  'core-service-context-paths',
);

const coreServiceContextPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreServiceContextPaths: coreServiceContextPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreServiceContextPaths: {
          serviceContext: `${srcRoot}/utils/service-context.ts`,
          testHelper: `${srcRoot}/tests/helpers/service-context.test-helper.ts`,
        },
      },
    };
  },
});

export const CORE_SERVICE_CONTEXT_PATHS = {
  provider: coreServiceContextPaths,
  task: coreServiceContextPathsTask,
};
