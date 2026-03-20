import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { DefinitionIssue } from '#src/schema/creator/definition-issue-types.js';

import { PluginUtils } from '#src/definition/plugins/plugin-utils.js';
import {
  getManagedPluginsForPlugin,
  getPluginMetadataByKey,
} from '#src/plugins/imports/utils.js';
import { pluginEntityType } from '#src/schema/plugins/entity-types.js';

import { createEntityIssue } from '../definition-issue-utils.js';

/**
 * Checks that base plugins with managed implementations have a valid
 * implementation plugin selected and enabled.
 *
 * A "base plugin" is one that has managed plugins (e.g., auth manages
 * better-auth and local-auth). These base plugins store their selected
 * implementation in `config.implementationPluginKey`.
 *
 * Produces warning-severity issues (blocks sync, allows save) because
 * the initial enable flow requires saving before the implementation
 * can be configured.
 */
export function checkPluginImplementations(
  container: ProjectDefinitionContainer,
): DefinitionIssue[] {
  const { definition, parserContext } = container;
  const { pluginStore } = parserContext;
  const enabledPlugins = definition.plugins ?? [];
  const issues: DefinitionIssue[] = [];

  for (const plugin of enabledPlugins) {
    const key = pluginEntityType.keyFromId(plugin.id);
    const metadata = getPluginMetadataByKey(pluginStore, key);
    if (!metadata) {
      continue;
    }

    // Only check base plugins that have managed plugins (implementations)
    const managedPlugins = getManagedPluginsForPlugin(pluginStore, key);
    if (managedPlugins.length === 0) {
      continue;
    }

    // Duck-type check for implementationPluginKey in config
    const { config } = plugin;
    if (
      typeof config !== 'object' ||
      config === null ||
      !('implementationPluginKey' in config)
    ) {
      continue;
    }

    const implKey = (config as Record<string, unknown>).implementationPluginKey;

    if (typeof implKey !== 'string' || implKey === '') {
      issues.push(
        createEntityIssue(container, plugin.id, [], {
          message: `Plugin '${metadata.displayName}' requires an implementation to be selected`,
          severity: 'warning',
        }),
      );
      continue;
    }

    // Check if the selected implementation is enabled
    const implPlugin = PluginUtils.byKey(definition, implKey);
    if (!implPlugin) {
      const implMetadata = getPluginMetadataByKey(pluginStore, implKey);
      const implDisplayName = implMetadata?.displayName ?? implKey;

      issues.push(
        createEntityIssue(container, plugin.id, [], {
          message: `Plugin '${metadata.displayName}' has implementation '${implDisplayName}' selected but it is not enabled`,
          severity: 'warning',
          fix: implMetadata
            ? {
                label: `Enable ${implDisplayName}`,
                applySetter: (draft) => {
                  PluginUtils.setPluginConfig(
                    draft,
                    implMetadata,
                    {},
                    container,
                  );
                },
              }
            : undefined,
        }),
      );
    }
  }

  return issues;
}
