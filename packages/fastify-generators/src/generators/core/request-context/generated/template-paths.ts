import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreRequestContextPaths {
  requestContext: string;
}

const coreRequestContextPaths = createProviderType<CoreRequestContextPaths>(
  'core-request-context-paths',
);

const coreRequestContextPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreRequestContextPaths: coreRequestContextPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreRequestContextPaths: {
          requestContext: `${srcRoot}/plugins/request-context.ts`,
        },
      },
    };
  },
});

export const CORE_REQUEST_CONTEXT_PATHS = {
  provider: coreRequestContextPaths,
  task: coreRequestContextPathsTask,
};
