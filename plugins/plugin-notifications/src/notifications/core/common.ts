import {
  createPluginModule,
  definitionIssueCheckerSpec,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

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

    issueCheckers.checkers.set(
      pluginKey,
      createNotificationsSchemaChecker(pluginKey),
    );
  },
});
