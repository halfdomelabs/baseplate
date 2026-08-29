import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreAppSecretPaths {
  appSecret: string;
}

const coreAppSecretPaths = createProviderType<CoreAppSecretPaths>(
  'core-app-secret-paths',
);

const coreAppSecretPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreAppSecretPaths: coreAppSecretPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreAppSecretPaths: { appSecret: `${srcRoot}/services/app-secret.ts` },
      },
    };
  },
});

export const CORE_APP_SECRET_PATHS = {
  provider: coreAppSecretPaths,
  task: coreAppSecretPathsTask,
};
