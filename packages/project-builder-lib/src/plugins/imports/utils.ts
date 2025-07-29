import type { PluginMetadataWithPaths } from '../metadata/types.js';
import type { PluginStore } from './types.js';

/**
 * Gets a plugin metadata object by its key.
 *
 * @param pluginStore The plugin store to use
 * @param key The key of the plugin to get
 * @returns The plugin metadata object or undefined if the plugin is not found
 */
export function getPluginMetadataByKey(
  pluginStore: PluginStore,
  key: string,
): PluginMetadataWithPaths | undefined {
  return pluginStore.availablePlugins.find((p) => p.metadata.key === key)
    ?.metadata;
}

/**
 * Gets a plugin metadata object by its key.
 *
 * @param pluginStore The plugin store to use
 * @param key The key of the plugin to get
 * @returns The plugin metadata object
 * @throws An error if the plugin is not found
 */
export function getPluginMetadataByKeyOrThrow(
  pluginStore: PluginStore,
  key: string,
): PluginMetadataWithPaths {
  const metadata = getPluginMetadataByKey(pluginStore, key);
  if (!metadata) {
    throw new Error(`Could not find plugin with key ${key}`);
  }
  return metadata;
}
