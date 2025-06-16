import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AdminAdminLayoutPaths {
  adminLayout: string;
}

const adminAdminLayoutPaths = createProviderType<AdminAdminLayoutPaths>(
  'admin-admin-layout-paths',
);

const adminAdminLayoutPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { adminAdminLayoutPaths: adminAdminLayoutPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        adminAdminLayoutPaths: {
          adminLayout: `${srcRoot}/components/AdminLayout/index.tsx`,
        },
      },
    };
  },
});

export const ADMIN_ADMIN_LAYOUT_PATHS = {
  provider: adminAdminLayoutPaths,
  task: adminAdminLayoutPathsTask,
};
