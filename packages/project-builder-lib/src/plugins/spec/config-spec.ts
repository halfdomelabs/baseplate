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
  registerSchema: (pluginKey: string, schema: z.ZodTypeAny) => void;
  registerMigrations: (
    pluginKey: string,
    migrations: PluginConfigMigration[],
  ) => void;
  getSchema(pluginKey: string): z.ZodTypeAny | undefined;
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
  const schemas = new Map<string, z.ZodTypeAny>();
  const migrationsMap = new Map<string, PluginConfigMigration[]>();

  return {
    registerSchema(pluginKey, schema) {
      if (schemas.has(pluginKey)) {
        throw new Error(`Schema for plugin ${pluginKey} is already registered`);
      }
      schemas.set(pluginKey, schema);
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
    getSchema(pluginKey) {
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
