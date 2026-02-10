import { mapValuesOfMap } from '@baseplate-dev/utils';

import type { DefinitionSchemaCreator } from '#src/schema/index.js';

import { createFieldMapSpec } from '../utils/create-field-map-spec.js';

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

function sortAndValidateMigrations(
  migrations: PluginConfigMigration[],
  pluginKey: string,
): PluginConfigMigration[] {
  // make sure migrations are sorted by version and they are all unique
  const sortedMigrations = [...migrations].toSorted(
    (a, b) => a.version - b.version,
  );
  if (sortedMigrations.some((m) => m.version <= 0)) {
    throw new Error(
      `All migrations for plugin ${pluginKey} must have a positive version`,
    );
  }
  for (let i = 0; i < sortedMigrations.length - 1; i++) {
    if (sortedMigrations[i].version === sortedMigrations[i + 1].version) {
      throw new Error(
        `All migrations for plugin ${pluginKey} must have a unique version`,
      );
    }
  }
  return sortedMigrations;
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
export const pluginConfigSpec = createFieldMapSpec(
  'core/plugin-config',
  (t) => ({
    schemas: t.map<string, DefinitionSchemaCreator>(),
    migrations: t.map<string, PluginConfigMigration[]>(),
  }),
  {
    use: (values) => {
      const validatedMigrations = mapValuesOfMap(
        values.migrations,
        (migrations, pluginKey) =>
          sortAndValidateMigrations(migrations, pluginKey),
      );
      return {
        getSchemaCreator: (pluginKey: string) => values.schemas.get(pluginKey),
        getMigrations: (pluginKey: string) =>
          validatedMigrations.get(pluginKey),
        getLastMigrationVersion: (pluginKey: string) => {
          const migrations = values.migrations.get(pluginKey);
          return migrations?.at(-1)?.version;
        },
      };
    },
  },
);
