import {
  createPluginModule,
  FeatureUtils,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { RateLimitDefinitionEditor } from './components/rate-limit-definition-editor.js';
import { createRateLimitPartialDefinition } from './schema/models.js';

import '../../styles.css';

const RATE_LIMIT_FEATURE_NAME = 'system/rate-limit';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
    pluginDefaults: pluginDefaultsSpec,
  },
  initialize: ({ webConfig, pluginDefaults }, { pluginKey }) => {
    webConfig.components.set(pluginKey, RateLimitDefinitionEditor);
    pluginDefaults.builders.set(pluginKey, ({ draft }) => {
      const rateLimitFeatureRef = FeatureUtils.ensureFeatureByNameRecursively(
        draft,
        RATE_LIMIT_FEATURE_NAME,
      );
      return {
        config: {
          rateLimitFeatureRef,
          rateLimitOptions: {},
        },
        partialDef: createRateLimitPartialDefinition(RATE_LIMIT_FEATURE_NAME),
      };
    });
  },
});
