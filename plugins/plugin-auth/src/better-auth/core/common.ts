import {
  authModelsSpec,
  createPluginModule,
  definitionIssueCheckerSpec,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { BETTER_AUTH_MODELS } from '../constants/model-names.js';
import { createBetterAuthPluginDefinitionSchema } from './schema/plugin-definition.js';
import { createBetterAuthSchemaChecker } from './schema/schema-issue-checker.js';

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
    pluginConfig.schemas.set(pluginKey, createBetterAuthPluginDefinitionSchema);

    authModels.getAuthModels.set(() => ({
      user: BETTER_AUTH_MODELS.user,
    }));

    issueCheckers.checkers.set(
      pluginKey,
      createBetterAuthSchemaChecker(pluginKey),
    );
  },
});
