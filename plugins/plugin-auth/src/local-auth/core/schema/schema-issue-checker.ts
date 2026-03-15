import type { DefinitionIssueChecker } from '@baseplate-dev/project-builder-lib';

import {
  applyMergedDefinition,
  createEntityIssue,
  diffDefinition,
  FeatureUtils,
  pluginEntityType,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import { getAuthPluginDefinition } from '#src/auth/index.js';

import { createLocalAuthPartialDefinition } from './models.js';

export function createLocalAuthSchemaChecker(
  pluginKey: string,
): DefinitionIssueChecker {
  return (container) => {
    const pluginConfig = PluginUtils.configByKey(
      container.definition,
      pluginKey,
    );
    if (!pluginConfig) return [];

    const authConfig = getAuthPluginDefinition(container.definition);

    const authFeatureName: string = FeatureUtils.getFeaturePathById(
      container.definition,
      authConfig.authFeatureRef,
    );

    const partialDef = createLocalAuthPartialDefinition(authFeatureName);
    const diff = diffDefinition(
      container.schema,
      container.definition,
      partialDef,
    );

    if (!diff.hasChanges) return [];

    const changedLabels = diff.entries.map((e) => e.label).join(', ');

    return [
      createEntityIssue(container, pluginEntityType.idFromKey(pluginKey), [], {
        message: `Local Auth plugin models are out of sync: ${changedLabels}. Save the Local Auth plugin settings to update.`,
        severity: 'warning',
        fix: {
          label: 'Sync Local Auth models',
          applySetter: applyMergedDefinition(container, partialDef),
        },
      }),
    ];
  };
}
