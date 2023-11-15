import { SchemaMigration, SCHEMA_MIGRATIONS } from './migrations.js';
import { ProjectConfig } from '../schema/index.js';

export function runSchemaMigrations(config: ProjectConfig): {
  newConfig: ProjectConfig;
  appliedMigrations: SchemaMigration[];
} {
  const schemaVersion = config.schemaVersion || 0;

  const unappliedMigrations = SCHEMA_MIGRATIONS.filter(
    (m) => m.version > schemaVersion,
  ).sort((a, b) => a.version - b.version);

  const newConfig = unappliedMigrations.reduce(
    (draftConfig, migration) => ({
      ...migration.migrate(draftConfig),
      schemaVersion: migration.version,
    }),
    config,
  );

  return { newConfig, appliedMigrations: unappliedMigrations };
}

export function getLatestMigrationVersion(): number {
  return SCHEMA_MIGRATIONS[SCHEMA_MIGRATIONS.length - 1].version;
}
