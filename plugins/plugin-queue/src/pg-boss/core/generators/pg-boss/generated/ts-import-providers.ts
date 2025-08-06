import {
  createTsImportMap,
  packageScope,
} from '@baseplate-dev/core-generators';
import { createGeneratorTask } from '@baseplate-dev/sync';

import {
  queueServiceImportsProvider,
  queueServiceImportsSchema,
} from '#src/queue/providers/queue-service.provider.js';

import { PG_BOSS_CORE_PG_BOSS_PATHS } from './template-paths.js';

const pgBossCorePgBossImportsTask = createGeneratorTask({
  dependencies: {
    paths: PG_BOSS_CORE_PG_BOSS_PATHS.provider,
  },
  exports: {
    queueServiceImports: queueServiceImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        queueServiceImports: createTsImportMap(queueServiceImportsSchema, {
          createQueue: paths.pgBossService,
        }),
      },
    };
  },
});

export const PG_BOSS_CORE_PG_BOSS_IMPORTS = {
  task: pgBossCorePgBossImportsTask,
};
