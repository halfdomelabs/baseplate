import type {
  PluginImplementationStore,
  PluginMetadataWithPaths,
} from '#src/plugins/index.js';
import type {
  BasePluginDefinition,
  ProjectDefinition,
} from '#src/schema/index.js';

import { pluginConfigSpec } from '#src/plugins/index.js';
import { pluginEntityType } from '#src/schema/index.js';

function byId(
  projectDefinition: ProjectDefinition,
  id: string,
): BasePluginDefinition | null {
  const pluginEntityId = pluginEntityType.fromUid(id);
  const plugin = projectDefinition.plugins?.find(
    (m) => m.id === pluginEntityId,
  );
  return plugin ?? null;
}

function byIdOrThrow(
  projectDefinition: ProjectDefinition,
  id: string,
): BasePluginDefinition {
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
  pluginImplementationStore: PluginImplementationStore,
): void {
  const plugins = projectDefinition.plugins ?? [];
  const pluginEntityId = pluginEntityType.fromUid(plugin.id);

  const pluginConfigService =
    pluginImplementationStore.getPluginSpec(pluginConfigSpec);
  const lastMigrationVersion = pluginConfigService.getLastMigrationVersion(
    plugin.id,
  );

  projectDefinition.plugins = plugins.some((p) => p.id === pluginEntityId)
    ? plugins.map((p) =>
        pluginEntityId === p.id ? { ...p, config: pluginConfig } : p,
      )
    : [
        ...plugins,
        {
          id: pluginEntityId,
          name: plugin.name,
          version: plugin.version,
          packageName: plugin.packageName,
          config: pluginConfig,
          configSchemaVersion: lastMigrationVersion,
        },
      ];
}

export const PluginUtils = {
  byId,
  byIdOrThrow,
  setPluginConfig,
  configByIdOrThrow,
};
