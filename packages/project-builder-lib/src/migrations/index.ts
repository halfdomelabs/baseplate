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

export function isMigrateableProjectDefinition(
  projectDefinition: unknown,
): projectDefinition is ProjectDefinition {
  return (
    typeof projectDefinition === 'object' &&
    !!projectDefinition &&
    'schemaVersion' in projectDefinition
  );
}

export class SchemaMigrationError extends Error {
  public readonly migrationName: string;
  public readonly cause: unknown;

  constructor(migrationName: string, cause: unknown) {
    super(
      `Schema migration ${migrationName} failed: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
    this.name = 'SchemaMigrationError';
    this.migrationName = migrationName;
    this.cause = cause;
  }
}

export function runSchemaMigrations(config: ProjectDefinition): {
  migratedDefinition: ProjectDefinition;
  appliedMigrations: SchemaMigration[];
} {
  const { schemaVersion } = config;

  const unappliedMigrations = SCHEMA_MIGRATIONS.filter(
    (m) => m.version > schemaVersion,
  ).sort((a, b) => a.version - b.version);

  let migratedDefinition = config;
  for (const migration of unappliedMigrations) {
    try {
      migratedDefinition = {
        ...(migration.migrate(migratedDefinition) as ProjectDefinition),
        schemaVersion: migration.version,
      };
    } catch (cause) {
      throw new SchemaMigrationError(migration.name, cause);
    }
  }

  return { migratedDefinition, appliedMigrations: unappliedMigrations };
}

export function getLatestMigrationVersion(): number {
  return SCHEMA_MIGRATIONS.at(-1)?.version ?? 0;
}
