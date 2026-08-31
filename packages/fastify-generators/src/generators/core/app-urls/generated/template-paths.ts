import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreAppUrlsPaths {
  appUrls: string;
}

const coreAppUrlsPaths = createProviderType<CoreAppUrlsPaths>(
  'core-app-urls-paths',
);

const coreAppUrlsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreAppUrlsPaths: coreAppUrlsPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreAppUrlsPaths: { appUrls: `${srcRoot}/services/app-urls.ts` },
      },
    };
  },
});

export const CORE_APP_URLS_PATHS = {
  provider: coreAppUrlsPaths,
  task: coreAppUrlsPathsTask,
};
