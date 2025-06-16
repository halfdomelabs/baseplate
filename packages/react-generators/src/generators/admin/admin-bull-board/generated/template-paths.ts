import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AdminAdminBullBoardPaths {
  bullBoard: string;
  bullBoardPage: string;
}

const adminAdminBullBoardPaths = createProviderType<AdminAdminBullBoardPaths>(
  'admin-admin-bull-board-paths',
);

const adminAdminBullBoardPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { adminAdminBullBoardPaths: adminAdminBullBoardPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        adminAdminBullBoardPaths: {
          bullBoard: `${srcRoot}/pages/bull-board/bull-board.gql`,
          bullBoardPage: `${srcRoot}/pages/bull-board/index.tsx`,
        },
      },
    };
  },
});

export const ADMIN_ADMIN_BULL_BOARD_PATHS = {
  provider: adminAdminBullBoardPaths,
  task: adminAdminBullBoardPathsTask,
};
