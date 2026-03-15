import type { DefinitionIssueChecker } from '@baseplate-dev/project-builder-lib';

import {
  applyMergedDefinition,
  authModelsSpec,
  createEntityIssue,
  diffDefinition,
  FeatureUtils,
  pluginEntityType,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { StoragePluginDefinition } from './plugin-definition.js';

import { createStoragePartialDefinition } from './models.js';

export function createStorageSchemaChecker(
  pluginKey: string,
): DefinitionIssueChecker {
  return (container) => {
    const pluginConfig = PluginUtils.configByKey(
      container.definition,
      pluginKey,
    ) as StoragePluginDefinition | undefined;
    if (!pluginConfig) return [];

    const authModels = container.pluginStore.use(authModelsSpec);
    const authModelResult = authModels.getAuthModels(container.definition);
    if (!authModelResult) return [];

    let storageFeatureName: string;
    try {
      storageFeatureName = FeatureUtils.getFeaturePathById(
        container.definition,
        pluginConfig.storageFeatureRef,
      );
    } catch {
      return [];
    }

    const partialDef = createStoragePartialDefinition(
      storageFeatureName,
      authModelResult.user,
    );
    const diff = diffDefinition(
      container.schema,
      container.definition,
      partialDef,
    );

    if (!diff.hasChanges) return [];

    const changedLabels = diff.entries.map((e) => e.label).join(', ');

    return [
      createEntityIssue(container, pluginEntityType.idFromKey(pluginKey), [], {
        message: `Storage plugin models are out of sync: ${changedLabels}. Save the Storage plugin settings to update.`,
        severity: 'warning',
        fix: {
          label: 'Sync Storage models',
          applySetter: applyMergedDefinition(container, partialDef),
        },
      }),
    ];
  };
}
