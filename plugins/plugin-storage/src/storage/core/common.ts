import {
  createPluginModule,
  definitionIssueCheckerSpec,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { STORAGE_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { createStoragePluginDefinitionSchema } from './schema/plugin-definition.js';
import { createStorageSchemaChecker } from './schema/schema-issue-checker.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    issueCheckers: definitionIssueCheckerSpec,
  },
  initialize: ({ pluginConfig, issueCheckers }, { pluginKey }) => {
    pluginConfig.schemas.set(pluginKey, createStoragePluginDefinitionSchema);
    pluginConfig.migrations.set(pluginKey, STORAGE_PLUGIN_CONFIG_MIGRATIONS);
    issueCheckers.checkers.set(
      pluginKey,
      createStorageSchemaChecker(pluginKey),
    );
  },
});
