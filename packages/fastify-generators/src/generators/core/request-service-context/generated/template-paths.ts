import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreRequestServiceContextPaths {
  requestServiceContext: string;
}

const coreRequestServiceContextPaths =
  createProviderType<CoreRequestServiceContextPaths>(
    'core-request-service-context-paths',
  );

const coreRequestServiceContextPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    coreRequestServiceContextPaths: coreRequestServiceContextPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreRequestServiceContextPaths: {
          requestServiceContext: `${srcRoot}/utils/request-service-context.ts`,
        },
      },
    };
  },
});

export const CORE_REQUEST_SERVICE_CONTEXT_PATHS = {
  provider: coreRequestServiceContextPaths,
  task: coreRequestServiceContextPathsTask,
};
