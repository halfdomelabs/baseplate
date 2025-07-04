import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactRoutesProvider } from '#src/providers/routes.js';

export interface AdminAdminHomePaths {
  home: string;
}

const adminAdminHomePaths = createProviderType<AdminAdminHomePaths>(
  'admin-admin-home-paths',
);

const adminAdminHomePathsTask = createGeneratorTask({
  dependencies: { reactRoutes: reactRoutesProvider },
  exports: { adminAdminHomePaths: adminAdminHomePaths.export() },
  run({ reactRoutes }) {
    const routesRoot = reactRoutes.getDirectoryBase();

    return {
      providers: {
        adminAdminHomePaths: { home: `${routesRoot}/index.tsx` },
      },
    };
  },
});

export const ADMIN_ADMIN_HOME_PATHS = {
  provider: adminAdminHomePaths,
  task: adminAdminHomePathsTask,
};
