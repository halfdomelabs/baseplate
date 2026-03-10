import type { PluginModule } from './imports/types.js';
import type { PluginMetadataWithPaths } from './metadata/types.js';
import type { PluginConfigMigration } from './spec/config-spec.js';

import { initializePlugins } from './imports/loader.js';
import { PluginSpecStore } from './store/store.js';

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
    key: defaultId,
    name: defaultId,
    packageName: `@test/${defaultId}`,
    fullyQualifiedName: `@test/${defaultId}:${defaultId}`,
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

/**
 * Creates a PluginSpecStore for testing purposes.
 *
 * When no modules are provided, returns an empty store where specs are
 * lazily initialized with their defaults (e.g., built-in definition issue checkers).
 *
 * When modules are provided, uses `initializePlugins` to create a store
 * with those modules registered, allowing tests to configure any specs they need.
 *
 * @param modules - Optional plugin modules to register
 * @returns A PluginSpecStore ready for use in tests
 */
export function createTestPluginSpecStore(
  modules?: PluginModule[],
): PluginSpecStore {
  if (!modules || modules.length === 0) {
    return new PluginSpecStore();
  }

  return initializePlugins(
    modules.map((module, index) => ({
      key: `core/test/${module.name}-${index}`,
      pluginKey: 'core',
      module,
    })),
  );
}
