import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PgBossCorePgBossPaths {
  pgBossPlugin: string;
  pgBossService: string;
  runWorkers: string;
}

const pgBossCorePgBossPaths = createProviderType<PgBossCorePgBossPaths>(
  'pg-boss-core-pg-boss-paths',
);

const pgBossCorePgBossPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { pgBossCorePgBossPaths: pgBossCorePgBossPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        pgBossCorePgBossPaths: {
          pgBossPlugin: `${srcRoot}/plugins/pg-boss.plugin.ts`,
          pgBossService: `${srcRoot}/services/pg-boss.service.ts`,
          runWorkers: `${srcRoot}/scripts/run-workers.ts`,
        },
      },
    };
  },
});

export const PG_BOSS_CORE_PG_BOSS_PATHS = {
  provider: pgBossCorePgBossPaths,
  task: pgBossCorePgBossPathsTask,
};
