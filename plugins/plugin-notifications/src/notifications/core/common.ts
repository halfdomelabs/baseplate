import {
  createPluginModule,
  definitionIssueCheckerSpec,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { createNotificationsWebSubscriptionsChecker } from './schema/notification-web-issue-checker.js';
import { createNotificationsPluginDefinitionSchema } from './schema/plugin-definition.js';
import { createNotificationsSchemaChecker } from './schema/schema-issue-checker.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    issueCheckers: definitionIssueCheckerSpec,
  },
  initialize: ({ pluginConfig, issueCheckers }, { pluginKey }) => {
    pluginConfig.schemas.set(
      pluginKey,
      createNotificationsPluginDefinitionSchema,
    );

    const schemaChecker = createNotificationsSchemaChecker(pluginKey);
    const webSubscriptionsChecker =
      createNotificationsWebSubscriptionsChecker(pluginKey);
    issueCheckers.checkers.set(pluginKey, (container) => [
      ...schemaChecker(container),
      ...webSubscriptionsChecker(container),
    ]);
  },
});
