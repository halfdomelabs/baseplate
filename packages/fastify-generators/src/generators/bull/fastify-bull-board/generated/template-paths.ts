import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { appModuleProvider } from '#src/generators/core/app-module/app-module.generator.js';

export interface BullFastifyBullBoardPaths {
  index: string;
  pluginsBullBoard: string;
  schemaAuthenticateMutations: string;
  servicesAuthService: string;
}

const bullFastifyBullBoardPaths = createProviderType<BullFastifyBullBoardPaths>(
  'bull-fastify-bull-board-paths',
);

const bullFastifyBullBoardPathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { bullFastifyBullBoardPaths: bullFastifyBullBoardPaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        bullFastifyBullBoardPaths: {
          index: `${moduleRoot}/bull-board/index.ts`,
          pluginsBullBoard: `${moduleRoot}/bull-board/plugins/bull-board.ts`,
          schemaAuthenticateMutations: `${moduleRoot}/bull-board/schema/authenticate.mutations.ts`,
          servicesAuthService: `${moduleRoot}/bull-board/services/auth.service.ts`,
        },
      },
    };
  },
});

export const BULL_FASTIFY_BULL_BOARD_PATHS = {
  provider: bullFastifyBullBoardPaths,
  task: bullFastifyBullBoardPathsTask,
};
