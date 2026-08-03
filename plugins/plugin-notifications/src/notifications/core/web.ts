import {
  authModelsSpec,
  createPluginModule,
  FeatureUtils,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';
import {
  createWebAppSettingsWebConfig,
  webAppSchemaExtensionWebSpec,
} from '@baseplate-dev/project-builder-lib/web';

import { NotificationsDefinitionEditor } from './components/notifications-definition-editor.js';
import { NotificationsWebAppSettingsForm } from './components/notifications-web-app-settings-form.js';
import { createNotificationsPartialDefinition } from './schema/models.js';
import { buildDefaultNotificationCategory } from './schema/plugin-definition.js';

import '../../styles.css';

const NOTIFICATIONS_FEATURE_NAME = 'notifications';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
    pluginDefaults: pluginDefaultsSpec,
    webAppSchemaExtensionWeb: webAppSchemaExtensionWebSpec,
  },
  initialize: (
    { webConfig, pluginDefaults, webAppSchemaExtensionWeb },
    { pluginKey },
  ) => {
    webConfig.components.set(pluginKey, NotificationsDefinitionEditor);
    webAppSchemaExtensionWeb.configs.set(
      pluginKey,
      createWebAppSettingsWebConfig({
        pluginKey,
        Form: NotificationsWebAppSettingsForm,
      }),
    );
    pluginDefaults.builders.set(pluginKey, ({ draft, pluginStore }) => {
      const notificationsFeatureRef =
        FeatureUtils.ensureFeatureByNameRecursively(
          draft,
          NOTIFICATIONS_FEATURE_NAME,
        );
      const authModels = pluginStore
        .use(authModelsSpec)
        .getAuthModelsOrThrow(draft);
      return {
        config: {
          notificationsFeatureRef,
          categories: [buildDefaultNotificationCategory()],
        },
        partialDef: createNotificationsPartialDefinition(
          NOTIFICATIONS_FEATURE_NAME,
          authModels.user,
        ),
      };
    });
  },
});
