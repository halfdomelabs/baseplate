import {
  createPluginModule,
  FeatureUtils,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { PlaceholderAuthDefinitionEditor } from './components/placeholder-auth-definition-editor.js';
import { createPlaceholderAuthPartialDefinition } from './schema/models.js';

import '../../styles.css';

const AUTH_FEATURE_NAME = 'accounts/auth';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
    pluginDefaults: pluginDefaultsSpec,
  },
  initialize: ({ webConfig, pluginDefaults }, { pluginKey }) => {
    webConfig.components.set(pluginKey, PlaceholderAuthDefinitionEditor);
    pluginDefaults.builders.set(pluginKey, ({ draft }) => {
      // Idempotent with the parent auth builder, which also ensures this.
      FeatureUtils.ensureFeatureByNameRecursively(draft, AUTH_FEATURE_NAME);
      return {
        config: {},
        partialDef: createPlaceholderAuthPartialDefinition(AUTH_FEATURE_NAME),
      };
    });
  },
});
