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

import { PG_BOSS_CORE_PG_BOSS_PATHS } from './template-paths.js';

export const pgBossImportsSchema = createTsImportMapSchema({
  createQueueRuntime: {},
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
  exports: { pgBossImports: pgBossImportsProvider.export(packageScope) },
  run({ paths }) {
    return {
      providers: {
        pgBossImports: createTsImportMap(pgBossImportsSchema, {
          createQueueRuntime: paths.pgBossService,
        }),
      },
    };
  },
});

export const PG_BOSS_CORE_PG_BOSS_IMPORTS = {
  task: pgBossCorePgBossImportsTask,
};
