import type { SchemaParserContext } from '#src/parser/types.js';
import type {
  PluginImplementationStore,
  PluginMetadataWithPaths,
} from '#src/plugins/index.js';
import type {
  BasePluginDefinition,
  ProjectDefinition,
} from '#src/schema/index.js';

import {
  getPluginMetadataByKeyOrThrow,
  pluginConfigSpec,
} from '#src/plugins/index.js';
import { pluginEntityType } from '#src/schema/index.js';

function byKey(
  projectDefinition: ProjectDefinition,
  key: string,
): BasePluginDefinition | undefined {
  const pluginEntityId = pluginEntityType.idFromKey(key);
  const plugin = projectDefinition.plugins?.find(
    (m) => m.id === pluginEntityId,
  );
  return plugin;
}

function byKeyOrThrow(
  projectDefinition: ProjectDefinition,
  id: string,
): BasePluginDefinition {
  const plugin = byKey(projectDefinition, id);
  if (!plugin) {
    throw new Error(`Could not find plugin with ID ${id}`);
  }
  return plugin;
}

function configByKey(
  projectDefinition: ProjectDefinition,
  key: string,
): unknown {
  const def = byKey(projectDefinition, key);
  return def?.config;
}

function configByKeyOrThrow(
  projectDefinition: ProjectDefinition,
  key: string,
): unknown {
  const def = byKeyOrThrow(projectDefinition, key);
  return def.config;
}

function setPluginConfig(
  projectDefinition: ProjectDefinition,
  plugin: PluginMetadataWithPaths,
  pluginConfig: unknown,
  pluginImplementationStore: PluginImplementationStore,
): void {
  const plugins = projectDefinition.plugins ?? [];
  const pluginEntityId = pluginEntityType.idFromKey(plugin.key);

  const pluginConfigService =
    pluginImplementationStore.getPluginSpec(pluginConfigSpec);
  const lastMigrationVersion = pluginConfigService.getLastMigrationVersion(
    plugin.key,
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

/**
 * Disables a plugin and all plugins that it manages recursively.
 *
 * @param projectDefinition The project definition to disable the plugin in
 * @param pluginKey The ID of the plugin to disable
 * @param context The schema parser context to use
 */
function disablePlugin(
  projectDefinition: ProjectDefinition,
  pluginKey: string,
  context: SchemaParserContext,
): void {
  // Get plugin metadata to be disabled
  const pluginMetadata = getPluginMetadataByKeyOrThrow(
    context.pluginStore,
    pluginKey,
  );

  // Make sure we disable any plugins that are managed by this plugin
  const managedPlugins = projectDefinition.plugins?.filter((p) => {
    const managedPlugin = getPluginMetadataByKeyOrThrow(
      context.pluginStore,
      pluginEntityType.keyFromId(p.id),
    );
    return managedPlugin.managedBy === pluginMetadata.fullyQualifiedName;
  });
  if (managedPlugins) {
    for (const p of managedPlugins)
      disablePlugin(projectDefinition, p.id, context);
  }

  projectDefinition.plugins = projectDefinition.plugins?.filter(
    (p) => p.id !== pluginEntityType.idFromKey(pluginKey),
  );
}

export const PluginUtils = {
  byKey,
  byKeyOrThrow,
  configByKey,
  setPluginConfig,
  configByKeyOrThrow,
  disablePlugin,
};
