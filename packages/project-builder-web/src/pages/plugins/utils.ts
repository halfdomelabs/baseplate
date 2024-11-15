import type {
  PluginImplementationStore,
  PluginMetadataWithPaths,
  PluginStore,
  ProjectDefinition,
} from '@halfdomelabs/project-builder-lib';

import { createPluginImplementationStore } from '@halfdomelabs/project-builder-lib';

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
