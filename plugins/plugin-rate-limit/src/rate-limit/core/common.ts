import {
  createPluginModule,
  definitionIssueCheckerSpec,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { createRateLimitPluginDefinitionSchema } from './schema/plugin-definition.js';
import { createRateLimitSchemaChecker } from './schema/schema-issue-checker.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    issueCheckers: definitionIssueCheckerSpec,
  },
  initialize: ({ pluginConfig, issueCheckers }, { pluginKey }) => {
    pluginConfig.schemas.set(pluginKey, createRateLimitPluginDefinitionSchema);
    issueCheckers.checkers.set(
      pluginKey,
      createRateLimitSchemaChecker(pluginKey),
    );
  },
});
