import { migration005PrimaryUniqueRefs } from './migration-005-primaryUniqueRefs.js';
import { migration006IndividualServiceControllers } from './migration-006-individual-service-controllers.js';
import { SchemaMigration } from './types.js';
import { ProjectDefinition } from '../schema/index.js';

export const SCHEMA_MIGRATIONS: SchemaMigration[] = [
  migration005PrimaryUniqueRefs,
  migration006IndividualServiceControllers,
];

export function runSchemaMigrations(config: ProjectDefinition): {
  newConfig: ProjectDefinition;
  appliedMigrations: SchemaMigration[];
} {
  const schemaVersion = config.schemaVersion ?? 0;

  const unappliedMigrations = SCHEMA_MIGRATIONS.filter(
    (m) => m.version > schemaVersion,
  ).sort((a, b) => a.version - b.version);

  const newConfig = unappliedMigrations.reduce(
    (draftConfig, migration) => ({
      ...(migration.migrate(draftConfig) as ProjectDefinition),
      schemaVersion: migration.version,
    }),
    config,
  );

  return { newConfig, appliedMigrations: unappliedMigrations };
}

export function getLatestMigrationVersion(): number {
  return SCHEMA_MIGRATIONS[SCHEMA_MIGRATIONS.length - 1].version;
}
