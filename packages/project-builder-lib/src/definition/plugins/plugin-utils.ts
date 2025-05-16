import type { PluginMetadataWithPaths } from '@src/plugins/index.js';

import {
  type BasePlugin,
  pluginEntityType,
  type ProjectDefinition,
} from '@src/schema/index.js';

function byId(
  projectDefinition: ProjectDefinition,
  id: string,
): BasePlugin | null {
  const pluginEntityId = pluginEntityType.fromUid(id);
  const plugin = projectDefinition.plugins?.find(
    (m) => m.id === pluginEntityId,
  );
  return plugin ?? null;
}

function byIdOrThrow(
  projectDefinition: ProjectDefinition,
  id: string,
): BasePlugin {
  const plugin = byId(projectDefinition, id);
  if (!plugin) {
    throw new Error(`Could not find plugin with ID ${id}`);
  }
  return plugin;
}

function configByIdOrThrow(
  projectDefinition: ProjectDefinition,
  id: string,
): unknown {
  const def = byIdOrThrow(projectDefinition, id);
  return def.config;
}

function setPluginConfig(
  projectDefinition: ProjectDefinition,
  plugin: PluginMetadataWithPaths,
  pluginConfig: unknown,
): void {
  const plugins = projectDefinition.plugins ?? [];
  const pluginEntityId = pluginEntityType.fromUid(plugin.id);

  projectDefinition.plugins = plugins.some((p) => p.id === pluginEntityId)
    ? plugins.map((p) =>
        pluginEntityId === plugin.id ? { ...p, config: pluginConfig } : p,
      )
    : [
        ...plugins,
        {
          id: pluginEntityId,
          name: plugin.name,
          version: plugin.version,
          packageName: plugin.packageName,
          config: pluginConfig,
        },
      ];
}

export const PluginUtils = {
  byId,
  byIdOrThrow,
  setPluginConfig,
  configByIdOrThrow,
};
