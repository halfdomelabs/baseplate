import type { PluginStore } from '#src/plugins/imports/types.js';
import type { PluginMetadataWithPaths } from '#src/plugins/metadata/types.js';

/**
 * Creates a mock plugin metadata object for testing.
 */
export function createMockPluginMetadata(
  key: string,
  fullyQualifiedName: string,
  overrides: Partial<PluginMetadataWithPaths> = {},
): PluginMetadataWithPaths {
  return {
    key,
    name: key,
    displayName: key.charAt(0).toUpperCase() + key.slice(1),
    description: `${key} plugin`,
    version: '0.1.0',
    packageName: `@test/plugin-${key}`,
    fullyQualifiedName,
    pluginDirectory: `/plugins/${key}`,
    webBuildDirectory: `/plugins/${key}/web`,
    nodeModulePaths: [],
    webModulePaths: [],
    ...overrides,
  };
}

/**
 * Creates a mock plugin store from an array of plugin metadata.
 */
export function createMockPluginStore(
  pluginMetadata: PluginMetadataWithPaths[],
): PluginStore {
  return {
    availablePlugins: pluginMetadata.map((metadata) => ({
      metadata,
      modules: [],
    })),
    coreModules: [],
  };
}
