import type { ProjectDefinition } from '../schema/index.js';
import type { SchemaMigration } from './types.js';

import { migration005PrimaryUniqueRefs } from './migration-005-primaryUniqueRefs.js';
import { migration006IndividualServiceControllers } from './migration-006-individual-service-controllers.js';
import { migration007ModelGraphql } from './migration-007-model-graphql.js';
import { migration008AnonymousPublicRole } from './migration-008-anonymous-public-role.js';
import { migration009RenameRefs } from './migration-009-rename-refs.js';

export const SCHEMA_MIGRATIONS: SchemaMigration[] = [
  migration005PrimaryUniqueRefs,
  migration006IndividualServiceControllers,
  migration007ModelGraphql,
  migration008AnonymousPublicRole,
  migration009RenameRefs,
];

export function runSchemaMigrations(config: ProjectDefinition): {
  newConfig: ProjectDefinition;
  appliedMigrations: SchemaMigration[];
} {
  const schemaVersion = config.schemaVersion ?? 0;

  const unappliedMigrations = SCHEMA_MIGRATIONS.filter(
    (m) => m.version > schemaVersion,
  ).sort((a, b) => a.version - b.version);

  let newConfig = config;
  for (const migration of unappliedMigrations) {
    newConfig = {
      ...(migration.migrate(newConfig) as ProjectDefinition),
      schemaVersion: migration.version,
    };
  }

  return { newConfig, appliedMigrations: unappliedMigrations };
}

export function getLatestMigrationVersion(): number {
  return SCHEMA_MIGRATIONS.at(-1)?.version ?? 0;
}
