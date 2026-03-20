import {
  createPluginModule,
  definitionIssueCheckerSpec,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { createStripePluginDefinitionSchema } from './schema/plugin-definition.js';
import { createStripeSchemaChecker } from './schema/schema-issue-checker.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    issueCheckers: definitionIssueCheckerSpec,
  },
  initialize: ({ pluginConfig, issueCheckers }, { pluginKey }) => {
    pluginConfig.schemas.set(pluginKey, createStripePluginDefinitionSchema);
    issueCheckers.checkers.set(pluginKey, createStripeSchemaChecker(pluginKey));
  },
});
