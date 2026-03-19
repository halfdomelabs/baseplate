import {
  authModelsSpec,
  createPluginModule,
  definitionIssueCheckerSpec,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { LOCAL_AUTH_MODELS } from '#src/local-auth/constants/model-names.js';

import { createLocalAuthPluginDefinitionSchema } from './schema/plugin-definition.js';
import { createLocalAuthSchemaChecker } from './schema/schema-issue-checker.js';

// necessary for Typescript to infer the return type of the initialize function
export type { PluginModule } from '@baseplate-dev/project-builder-lib';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    authModels: authModelsSpec,
    issueCheckers: definitionIssueCheckerSpec,
  },
  initialize: ({ pluginConfig, authModels, issueCheckers }, { pluginKey }) => {
    pluginConfig.schemas.set(pluginKey, createLocalAuthPluginDefinitionSchema);
    authModels.getAuthModels.set(() => ({
      user: LOCAL_AUTH_MODELS.user,
    }));

    issueCheckers.checkers.set(
      pluginKey,
      createLocalAuthSchemaChecker(pluginKey),
    );
  },
});
