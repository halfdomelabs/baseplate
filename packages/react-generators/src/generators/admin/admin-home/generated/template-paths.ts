import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AdminAdminHomePaths {
  home: string;
}

const adminAdminHomePaths = createProviderType<AdminAdminHomePaths>(
  'admin-admin-home-paths',
);

const adminAdminHomePathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { adminAdminHomePaths: adminAdminHomePaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        adminAdminHomePaths: { home: `${srcRoot}/pages/Home/index.tsx` },
      },
    };
  },
});

export const ADMIN_ADMIN_HOME_PATHS = {
  provider: adminAdminHomePaths,
  task: adminAdminHomePathsTask,
};
