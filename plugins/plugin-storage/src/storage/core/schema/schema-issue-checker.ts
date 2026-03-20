import type { DefinitionIssueChecker } from '@baseplate-dev/project-builder-lib';

import {
  authModelsSpec,
  createPluginModelSyncChecker,
  FeatureUtils,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { StoragePluginDefinition } from './plugin-definition.js';

import { createStoragePartialDefinition } from './models.js';

export function createStorageSchemaChecker(
  pluginKey: string,
): DefinitionIssueChecker {
  return createPluginModelSyncChecker({
    pluginKey,
    pluginLabel: 'Storage',
    buildPartialDef: (container) => {
      const pluginConfig = PluginUtils.configByKey(
        container.definition,
        pluginKey,
      ) as StoragePluginDefinition | undefined;
      if (!pluginConfig) return undefined;

      const authModels = container.pluginStore.use(authModelsSpec);
      const authModelResult = authModels.getAuthModels(container.definition);
      if (!authModelResult) return undefined;

      try {
        const storageFeatureName = FeatureUtils.getFeaturePathByIdOrThrow(
          container.definition,
          pluginConfig.storageFeatureRef,
        );
        return createStoragePartialDefinition(
          storageFeatureName,
          authModelResult.user,
        );
      } catch {
        return undefined;
      }
    },
  });
}
