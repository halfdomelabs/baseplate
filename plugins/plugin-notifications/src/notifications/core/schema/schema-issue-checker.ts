import type { DefinitionIssueChecker } from '@baseplate-dev/project-builder-lib';

import {
  authModelsSpec,
  createPluginModelSyncChecker,
  FeatureUtils,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { NotificationsPluginDefinition } from './plugin-definition.js';

import { createNotificationsPartialDefinition } from './models.js';

/**
 * Keeps the plugin's `Notification` model in sync with the project definition.
 *
 * When the plugin is enabled but its required model is missing or has drifted,
 * this emits a warning with an auto-fix that merges the partial definition in.
 * This is what materializes the model regardless of how the plugin was enabled
 * (setup wizard, per-plugin editor, or MCP configure-plugin + apply-fix).
 */
export function createNotificationsSchemaChecker(
  pluginKey: string,
): DefinitionIssueChecker {
  return createPluginModelSyncChecker({
    pluginKey,
    pluginLabel: 'Notifications',
    buildPartialDef: (container) => {
      const pluginConfig = PluginUtils.configByKey(
        container.definition,
        pluginKey,
      ) as NotificationsPluginDefinition | undefined;
      if (!pluginConfig) return undefined;

      const authModels = container.pluginStore.use(authModelsSpec);
      const authModelResult = authModels.getAuthModels(container.definition);
      if (!authModelResult) return undefined;

      try {
        const notificationsFeatureName = FeatureUtils.getFeaturePathByIdOrThrow(
          container.definition,
          pluginConfig.notificationsFeatureRef,
        );
        return createNotificationsPartialDefinition(
          notificationsFeatureName,
          authModelResult.user,
        );
      } catch {
        return undefined;
      }
    },
  });
}
