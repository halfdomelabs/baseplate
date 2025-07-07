import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactRoutesProvider } from '#src/providers/routes.js';

export interface AdminAdminBullBoardPaths {
  bullBoard: string;
  bullBoardPage: string;
}

const adminAdminBullBoardPaths = createProviderType<AdminAdminBullBoardPaths>(
  'admin-admin-bull-board-paths',
);

const adminAdminBullBoardPathsTask = createGeneratorTask({
  dependencies: { reactRoutes: reactRoutesProvider },
  exports: { adminAdminBullBoardPaths: adminAdminBullBoardPaths.export() },
  run({ reactRoutes }) {
    const routesRoot = reactRoutes.getOutputRelativePath();

    return {
      providers: {
        adminAdminBullBoardPaths: {
          bullBoard: `${routesRoot}/bull-board/bull-board.gql`,
          bullBoardPage: `${routesRoot}/bull-board/index.tsx`,
        },
      },
    };
  },
});

export const ADMIN_ADMIN_BULL_BOARD_PATHS = {
  provider: adminAdminBullBoardPaths,
  task: adminAdminBullBoardPathsTask,
};
