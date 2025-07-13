import type { PluginMetadataWithPaths } from './metadata/types.js';
import type { PluginConfigMigration } from './spec/config-spec.js';

import { PluginImplementationStore } from './schema/store.js';
import {
  createPluginConfigImplementation,
  pluginConfigSpec,
} from './spec/config-spec.js';

/**
 * Creates a test plugin metadata object with sensible defaults.
 *
 * @param overrides - Partial plugin metadata to override defaults
 * @returns A complete PluginMetadataWithPaths object for testing
 */
export function createTestPluginMetadata(
  overrides: Partial<PluginMetadataWithPaths> = {},
): PluginMetadataWithPaths {
  const defaultId = overrides.name ?? 'test-plugin';

  return {
    id: defaultId,
    name: defaultId,
    packageName: `@test/${defaultId}`,
    version: '1.0.0',
    displayName: `Test ${defaultId}`,
    description: `A test plugin for ${defaultId}`,
    pluginDirectory: `/test/plugins/${defaultId}`,
    webBuildDirectory: `/test/plugins/${defaultId}/dist`,
    nodeModulePaths: ['/test/node_modules'],
    webModulePaths: [],
    ...overrides,
  };
}

/**
 * Creates a test plugin implementation store with optional migration configurations.
 *
 * @param migrations - Record of plugin keys to their migration arrays
 * @returns A PluginImplementationStore configured for testing
 */
export function createTestPluginImplementationStore(
  migrations: Record<string, PluginConfigMigration[]> = {},
): PluginImplementationStore {
  const pluginImplementationStore = new PluginImplementationStore({});
  const configImplementation = createPluginConfigImplementation();

  // Register migrations for each plugin
  for (const [pluginKey, pluginMigrations] of Object.entries(migrations)) {
    configImplementation.registerMigrations(pluginKey, pluginMigrations);
  }

  pluginImplementationStore.implementations[pluginConfigSpec.name] =
    configImplementation;

  return pluginImplementationStore;
}

/**
 * Creates a simple test migration for use in tests.
 *
 * @param version - The migration version
 * @param name - The migration name
 * @param configTransform - Optional function to transform the config
 * @returns A PluginConfigMigration object
 */
export function createTestMigration(
  version: number,
  name: string,
  configTransform?: (config: unknown) => unknown,
): PluginConfigMigration {
  return {
    name,
    version,
    migrate: (config) => ({
      updatedConfig: configTransform ? configTransform(config) : config,
    }),
  };
}
