import {
  authModelsSpec,
  createPluginModule,
  definitionIssueCheckerSpec,
  pluginConfigSpec,
  webAppSchemaExtensionSpec,
} from '@baseplate-dev/project-builder-lib';

import { LOCAL_AUTH_MODELS } from '#src/local-auth/constants/model-names.js';

import { LOCAL_AUTH_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { createLocalAuthPluginDefinitionSchema } from './schema/plugin-definition.js';
import { createLocalAuthSchemaChecker } from './schema/schema-issue-checker.js';
import { createLocalAuthWebAppSchema } from './schema/web-app-schema.js';

// necessary for Typescript to infer the return type of the initialize function
export type { PluginModule } from '@baseplate-dev/project-builder-lib';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    authModels: authModelsSpec,
    issueCheckers: definitionIssueCheckerSpec,
    webAppSchemaExtension: webAppSchemaExtensionSpec,
  },
  initialize: (
    { pluginConfig, authModels, issueCheckers, webAppSchemaExtension },
    { pluginKey },
  ) => {
    pluginConfig.schemas.set(pluginKey, createLocalAuthPluginDefinitionSchema);
    pluginConfig.migrations.set(pluginKey, LOCAL_AUTH_PLUGIN_CONFIG_MIGRATIONS);
    authModels.getAuthModels.set(() => ({
      user: LOCAL_AUTH_MODELS.user,
    }));

    issueCheckers.checkers.set(
      pluginKey,
      createLocalAuthSchemaChecker(pluginKey),
    );

    webAppSchemaExtension.schemas.set(pluginKey, createLocalAuthWebAppSchema);
  },
});
