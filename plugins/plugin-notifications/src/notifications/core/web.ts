import {
  authModelsSpec,
  createPluginModule,
  FeatureUtils,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { NotificationsDefinitionEditor } from './components/notifications-definition-editor.js';
import { createNotificationsPartialDefinition } from './schema/models.js';

import '../../styles.css';

const NOTIFICATIONS_FEATURE_NAME = 'notifications';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
    pluginDefaults: pluginDefaultsSpec,
  },
  initialize: ({ webConfig, pluginDefaults }, { pluginKey }) => {
    webConfig.components.set(pluginKey, NotificationsDefinitionEditor);
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
        },
        partialDef: createNotificationsPartialDefinition(
          NOTIFICATIONS_FEATURE_NAME,
          authModels.user,
        ),
      };
    });
  },
});
