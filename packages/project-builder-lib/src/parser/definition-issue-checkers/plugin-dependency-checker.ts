import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { DefinitionIssue } from '#src/schema/creator/definition-issue-types.js';

import { PluginUtils } from '#src/definition/plugins/plugin-utils.js';
import { getPluginMetadataByKey } from '#src/plugins/imports/utils.js';
import {
  buildEnabledPluginFqnSet,
  getUnmetPluginDependencies,
} from '#src/plugins/imports/validate-plugin-dependencies.js';
import { pluginEntityType } from '#src/schema/plugins/entity-types.js';

import { createEntityIssue } from '../definition-issue-utils.js';

/**
 * Checks that all enabled plugins have their required plugin dependencies met.
 *
 * For each enabled plugin, resolves its metadata and checks `pluginDependencies`.
 * Required (non-optional) dependencies that are not enabled produce error-severity
 * issues (blocking save) with an auto-fix that enables the missing plugin.
 */
export function checkPluginDependencies(
  container: ProjectDefinitionContainer,
): DefinitionIssue[] {
  const { definition, parserContext } = container;
  const { pluginStore } = parserContext;
  const enabledPlugins = definition.plugins ?? [];
  const issues: DefinitionIssue[] = [];

  const enabledFqns = buildEnabledPluginFqnSet(pluginStore, enabledPlugins);

  for (const plugin of enabledPlugins) {
    const key = pluginEntityType.keyFromId(plugin.id);
    const metadata = getPluginMetadataByKey(pluginStore, key);
    if (!metadata?.pluginDependencies) {
      continue;
    }

    const unmetDeps = getUnmetPluginDependencies(pluginStore, key, enabledFqns);

    for (const depMetadata of unmetDeps) {
      issues.push(
        createEntityIssue(container, plugin.id, [], {
          message: `Plugin '${metadata.displayName}' requires '${depMetadata.displayName}' to be enabled`,
          severity: 'error',
          fix: {
            label: `Enable ${depMetadata.displayName}`,
            applySetter: (draft) => {
              PluginUtils.setPluginConfig(draft, depMetadata, {}, container);
            },
          },
        }),
      );
    }
  }

  return issues;
}
