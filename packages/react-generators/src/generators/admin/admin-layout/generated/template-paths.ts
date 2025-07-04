import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactRoutesProvider } from '#src/providers/routes.js';

export interface AdminAdminLayoutPaths {
  adminRoute: string;
  adminLayout: string;
}

const adminAdminLayoutPaths = createProviderType<AdminAdminLayoutPaths>(
  'admin-admin-layout-paths',
);

const adminAdminLayoutPathsTask = createGeneratorTask({
  dependencies: {
    packageInfo: packageInfoProvider,
    reactRoutes: reactRoutesProvider,
  },
  exports: { adminAdminLayoutPaths: adminAdminLayoutPaths.export() },
  run({ packageInfo, reactRoutes }) {
    const routesRoot = reactRoutes.getDirectoryBase();
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        adminAdminLayoutPaths: {
          adminLayout: `${srcRoot}/components/admin-layout/admin-layout.tsx`,
          adminRoute: `${routesRoot}/route.tsx`,
        },
      },
    };
  },
});

export const ADMIN_ADMIN_LAYOUT_PATHS = {
  provider: adminAdminLayoutPaths,
  task: adminAdminLayoutPathsTask,
};
