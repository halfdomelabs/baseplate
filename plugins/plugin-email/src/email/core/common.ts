import {
  createPluginModule,
  definitionIssueCheckerSpec,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { EMAIL_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { createEmailPluginDefinitionSchema } from './schema/plugin-definition.js';
import { createEmailSchemaChecker } from './schema/schema-issue-checker.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    issueCheckers: definitionIssueCheckerSpec,
  },
  initialize: ({ pluginConfig, issueCheckers }, { pluginKey }) => {
    pluginConfig.schemas.set(pluginKey, createEmailPluginDefinitionSchema);
    pluginConfig.migrations.set(pluginKey, EMAIL_PLUGIN_CONFIG_MIGRATIONS);
    issueCheckers.checkers.set(pluginKey, createEmailSchemaChecker(pluginKey));
  },
});
