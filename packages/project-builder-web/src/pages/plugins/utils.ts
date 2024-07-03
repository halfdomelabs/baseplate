import {
  PluginMetadataWithPaths,
  PluginStore,
  ProjectDefinition,
  PluginImplementationStore,
  createPluginImplementationStore,
} from '@halfdomelabs/project-builder-lib';

export function loadPluginImplementationStoreWithNewPlugin(
  pluginStore: PluginStore,
  plugin: PluginMetadataWithPaths,
  projectDefinition: ProjectDefinition,
): PluginImplementationStore {
  const newProjectDefinition: ProjectDefinition = {
    ...projectDefinition,
    plugins: [
      ...(projectDefinition.plugins ?? []),
      {
        id: plugin.id,
        version: plugin.version,
        name: plugin.name,
        packageName: plugin.packageName,
      },
    ],
  };
  return createPluginImplementationStore(pluginStore, newProjectDefinition);
}
