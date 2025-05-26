import type { z } from 'zod';

import type { PluginSpecImplementation } from './types.js';

import { createPluginSpec } from './types.js';

export interface PluginConfigMigration {
  version: number;
  name: string;
  migrate: (config: unknown) => unknown;
}

/**
 * Spec for registering plugin config schema
 */
export interface PluginConfigSpec extends PluginSpecImplementation {
  registerSchema: (pluginId: string, schema: z.ZodTypeAny) => void;
  registerMigrations: (
    pluginId: string,
    migrations: PluginConfigMigration[],
  ) => void;
  getSchema(pluginId: string): z.ZodTypeAny | undefined;
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
  for (let i = 0; i < sortedMigrations.length - 1; i++) {
    if (sortedMigrations[i].version === sortedMigrations[i + 1].version) {
      throw new Error(`Migration versions must be unique`);
    }
  }
  return sortedMigrations;
}

export function createPluginConfigImplementation(): PluginConfigSpec {
  const schemas = new Map<string, z.ZodTypeAny>();
  const migrationsMap = new Map<string, PluginConfigMigration[]>();

  return {
    registerSchema(pluginId, schema) {
      if (schemas.has(pluginId)) {
        throw new Error(`Schema for plugin ${pluginId} is already registered`);
      }
      schemas.set(pluginId, schema);
    },
    registerMigrations(pluginId, migrations) {
      if (migrationsMap.has(pluginId)) {
        throw new Error(
          `Migrations for plugin ${pluginId} are already registered`,
        );
      }
      const sortedMigrations = sortAndValidateMigrations(migrations);
      migrationsMap.set(pluginId, sortedMigrations);
    },
    getSchema(pluginId) {
      return schemas.get(pluginId);
    },
    getMigrations(pluginId) {
      return migrationsMap.get(pluginId);
    },
    getLastMigrationVersion(pluginId) {
      const migrations = migrationsMap.get(pluginId);
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
