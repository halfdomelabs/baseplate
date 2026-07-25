import {
  createPluginModule,
  definitionIssueCheckerSpec,
  pluginConfigSpec,
  webAppSchemaExtensionSpec,
} from '@baseplate-dev/project-builder-lib';

import { STORAGE_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { createStoragePluginDefinitionSchema } from './schema/plugin-definition.js';
import { createStorageSchemaChecker } from './schema/schema-issue-checker.js';
import { createStorageWebAppSchema } from './schema/web-app-schema.js';

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
    pluginConfig.schemas.set(pluginKey, createStoragePluginDefinitionSchema);
    pluginConfig.migrations.set(pluginKey, STORAGE_PLUGIN_CONFIG_MIGRATIONS);
    issueCheckers.checkers.set(
      pluginKey,
      createStorageSchemaChecker(pluginKey),
    );
    webAppSchemaExtension.schemas.set(pluginKey, createStorageWebAppSchema);
  },
});
