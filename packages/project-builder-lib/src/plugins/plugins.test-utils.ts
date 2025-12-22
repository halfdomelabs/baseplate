import type { PluginMetadataWithPaths } from './metadata/types.js';
import type { PluginConfigMigration } from './spec/config-spec.js';

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
