import {
  createPluginModule,
  definitionIssueCheckerSpec,
  pluginConfigSpec,
  webAppSchemaExtensionSpec,
} from '@baseplate-dev/project-builder-lib';

import { NOTIFICATIONS_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { createNotificationsBackendSubscriptionsChecker } from './schema/notification-backend-issue-checker.js';
import { createNotificationsWebSubscriptionsChecker } from './schema/notification-web-issue-checker.js';
import { createNotificationsPluginDefinitionSchema } from './schema/plugin-definition.js';
import { createNotificationsSchemaChecker } from './schema/schema-issue-checker.js';
import { createNotificationsWebAppSchema } from './schema/web-app-schema.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    issueCheckers: definitionIssueCheckerSpec,
    webAppSchemaExtension: webAppSchemaExtensionSpec,
  },
  initialize: (
    { pluginConfig, issueCheckers, webAppSchemaExtension },
    { pluginKey },
  ) => {
    pluginConfig.schemas.set(
      pluginKey,
      createNotificationsPluginDefinitionSchema,
    );
    pluginConfig.migrations.set(
      pluginKey,
      NOTIFICATIONS_PLUGIN_CONFIG_MIGRATIONS,
    );
    webAppSchemaExtension.schemas.set(
      pluginKey,
      createNotificationsWebAppSchema,
    );

    const schemaChecker = createNotificationsSchemaChecker(pluginKey);
    const webSubscriptionsChecker =
      createNotificationsWebSubscriptionsChecker(pluginKey);
    const backendSubscriptionsChecker =
      createNotificationsBackendSubscriptionsChecker(pluginKey);
    issueCheckers.checkers.set(pluginKey, (container) => [
      ...schemaChecker(container),
      ...webSubscriptionsChecker(container),
      ...backendSubscriptionsChecker(container),
    ]);
  },
});
