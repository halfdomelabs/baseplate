import type { DefinitionSchemaCreator } from '#src/schema/index.js';

import type { PluginSpecImplementation } from './types.js';

import { createPluginSpec } from './types.js';

export interface PluginMigrationResult {
  updatedConfig?: unknown;
  updateProjectDefinition?: (draft: unknown) => void;
}

export interface PluginConfigMigration {
  version: number;
  name: string;
  /**
   * The function to migrate the plugin config and optionally update the project definition.
   *
   * @param config - The plugin config to migrate
   * @param projectDefinition - The project definition (read-only)
   * @returns Migration result with optional config and project definition updates
   */
  migrate: (
    config: unknown,
    projectDefinition: unknown,
  ) => PluginMigrationResult;
}

/**
 * Spec for registering plugin config schema
 */
export interface PluginConfigSpec extends PluginSpecImplementation {
  registerSchemaCreator: (
    pluginKey: string,
    schemaCreator: DefinitionSchemaCreator,
  ) => void;
  registerMigrations: (
    pluginKey: string,
    migrations: PluginConfigMigration[],
  ) => void;
  getSchemaCreator(pluginKey: string): DefinitionSchemaCreator | undefined;
  getMigrations(pluginId: string): PluginConfigMigration[] | undefined;
  getLastMigrationVersion(pluginId: string): number | undefined;
}

function sortAndValidateMigrations(
  migrations: PluginConfigMigration[],
): PluginConfigMigration[] {
  // make sure migrations are sorted by version and they are all unique
  const sortedMigrations = [...migrations].sort(
    (a, b) => a.version - b.version,
  );
  if (sortedMigrations.some((m) => m.version <= 0)) {
    throw new Error(`Migration version must be a positive integer`);
  }
  for (let i = 0; i < sortedMigrations.length - 1; i++) {
    if (sortedMigrations[i].version === sortedMigrations[i + 1].version) {
      throw new Error(`Migration versions must be unique`);
    }
  }
  return sortedMigrations;
}

export function createPluginConfigImplementation(): PluginConfigSpec {
  const schemas = new Map<string, DefinitionSchemaCreator>();
  const migrationsMap = new Map<string, PluginConfigMigration[]>();

  return {
    registerSchemaCreator(pluginKey, schemaCreator) {
      if (schemas.has(pluginKey)) {
        throw new Error(`Schema for plugin ${pluginKey} is already registered`);
      }
      schemas.set(pluginKey, schemaCreator);
    },
    registerMigrations(pluginKey, migrations) {
      if (migrationsMap.has(pluginKey)) {
        throw new Error(
          `Migrations for plugin ${pluginKey} are already registered`,
        );
      }
      const sortedMigrations = sortAndValidateMigrations(migrations);
      migrationsMap.set(pluginKey, sortedMigrations);
    },
    getSchemaCreator(pluginKey) {
      return schemas.get(pluginKey);
    },
    getMigrations(pluginKey) {
      return migrationsMap.get(pluginKey);
    },
    getLastMigrationVersion(pluginKey) {
      const migrations = migrationsMap.get(pluginKey);
      return migrations?.[migrations.length - 1]?.version;
    },
  };
}

/**
 * Spec for adding config for the plugin in the core plugin e.g.
 * {
 *  "plugins": [{
 *    "id": "...",
 *    "config": {
 *       ...PluginConfig schema
 *    }
 *  }]
 * }
 */
export const pluginConfigSpec = createPluginSpec('core/plugin-config', {
  defaultInitializer: createPluginConfigImplementation,
});
