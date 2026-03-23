import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';

/**
 * Finds a plugin by its key, throwing an error with available plugins if not found.
 */
export function findPluginByKey(
  plugins: PluginMetadataWithPaths[],
  pluginKey: string,
): PluginMetadataWithPaths {
  const plugin = plugins.find((p) => p.key === pluginKey);
  if (!plugin) {
    const available = plugins
      .filter((p) => !p.hidden)
      .map((p) => p.key)
      .join(', ');
    throw new Error(
      `Plugin "${pluginKey}" not found. Available plugins: ${available}`,
    );
  }
  return plugin;
}
