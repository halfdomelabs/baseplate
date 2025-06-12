import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreAxiosPaths {
  axios: string;
}

const coreAxiosPaths = createProviderType<CoreAxiosPaths>('core-axios-paths');

const coreAxiosPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreAxiosPaths: coreAxiosPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreAxiosPaths: { axios: `${srcRoot}/services/axios.ts` },
      },
    };
  },
});

export const CORE_AXIOS_PATHS = {
  provider: coreAxiosPaths,
  task: coreAxiosPathsTask,
};
