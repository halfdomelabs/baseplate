import type {
  PluginImplementationStore,
  PluginMetadataWithPaths,
  PluginStore,
  ProjectDefinition,
} from '@baseplate-dev/project-builder-lib';

import {
  createPluginImplementationStore,
  pluginEntityType,
} from '@baseplate-dev/project-builder-lib';

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
        id: pluginEntityType.idFromKey(plugin.key),
        version: plugin.version,
        name: plugin.name,
        packageName: plugin.packageName,
      },
    ],
  };
  return createPluginImplementationStore(pluginStore, newProjectDefinition);
}
