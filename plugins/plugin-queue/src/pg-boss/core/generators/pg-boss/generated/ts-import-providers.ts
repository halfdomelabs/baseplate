import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import {
  queueServiceImportsProvider,
  queueServiceImportsSchema,
} from '#src/queue/providers/queue-service.provider.js';

import { PG_BOSS_CORE_PG_BOSS_PATHS } from './template-paths.js';

export const pgBossImportsSchema = createTsImportMapSchema({
  cleanupOrphanedSchedules: {},
  getScheduledJobs: {},
  initializePgBoss: {},
  shutdownPgBoss: {},
  startWorkers: {},
});

export type PgBossImportsProvider = TsImportMapProviderFromSchema<
  typeof pgBossImportsSchema
>;

export const pgBossImportsProvider =
  createReadOnlyProviderType<PgBossImportsProvider>('pg-boss-imports');

const pgBossCorePgBossImportsTask = createGeneratorTask({
  dependencies: {
    paths: PG_BOSS_CORE_PG_BOSS_PATHS.provider,
  },
  exports: {
    pgBossImports: pgBossImportsProvider.export(packageScope),
    queueServiceImports: queueServiceImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        pgBossImports: createTsImportMap(pgBossImportsSchema, {
          cleanupOrphanedSchedules: paths.pgBossService,
          getScheduledJobs: paths.pgBossService,
          initializePgBoss: paths.pgBossService,
          shutdownPgBoss: paths.pgBossService,
          startWorkers: paths.pgBossService,
        }),
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
