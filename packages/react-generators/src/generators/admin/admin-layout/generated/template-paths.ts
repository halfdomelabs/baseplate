import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactPathsProvider } from '#src/providers/react-paths.js';
import { reactRoutesProvider } from '#src/providers/routes.js';

export interface AdminAdminLayoutPaths {
  adminLayout: string;
  adminRoute: string;
}

const adminAdminLayoutPaths = createProviderType<AdminAdminLayoutPaths>(
  'admin-admin-layout-paths',
);

const adminAdminLayoutPathsTask = createGeneratorTask({
  dependencies: {
    reactPaths: reactPathsProvider,
    reactRoutes: reactRoutesProvider,
  },
  exports: { adminAdminLayoutPaths: adminAdminLayoutPaths.export() },
  run({ reactPaths, reactRoutes }) {
    const componentsRoot = reactPaths.getComponentsFolder();
    const routesRoot = reactRoutes.getOutputRelativePath();

    return {
      providers: {
        adminAdminLayoutPaths: {
          adminLayout: `${componentsRoot}/layouts/admin-layout/admin-layout.tsx`,
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
