import type { DefinitionIssueChecker } from '@baseplate-dev/project-builder-lib';

import {
  applyMergedDefinition,
  createEntityIssue,
  diffDefinition,
  FeatureUtils,
  pluginEntityType,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { RateLimitPluginDefinition } from './plugin-definition.js';

import { createRateLimitPartialDefinition } from './models.js';

export function createRateLimitSchemaChecker(
  pluginKey: string,
): DefinitionIssueChecker {
  return (container) => {
    const pluginConfig = PluginUtils.configByKey(
      container.definition,
      pluginKey,
    ) as RateLimitPluginDefinition | undefined;
    if (!pluginConfig) return [];

    const featureRef = pluginConfig.rateLimitFeatureRef;
    if (!featureRef) return [];

    let featureName: string;
    try {
      featureName = FeatureUtils.getFeaturePathById(
        container.definition,
        featureRef,
      );
    } catch {
      return [];
    }

    const partialDef = createRateLimitPartialDefinition(featureName);
    const diff = diffDefinition(
      container.schema,
      container.definition,
      partialDef,
    );

    if (!diff.hasChanges) return [];

    const changedLabels = diff.entries.map((e) => e.label).join(', ');

    return [
      createEntityIssue(container, pluginEntityType.idFromKey(pluginKey), [], {
        message: `Rate Limit plugin models are out of sync: ${changedLabels}. Save the Rate Limit plugin settings to update.`,
        severity: 'warning',
        fix: {
          label: 'Sync Rate Limit models',
          applySetter: applyMergedDefinition(container, partialDef),
        },
      }),
    ];
  };
}
