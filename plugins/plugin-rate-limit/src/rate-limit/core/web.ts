import {
  createPluginModule,
  FeatureUtils,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { RateLimitDefinitionEditor } from './components/rate-limit-definition-editor.js';

import '../../styles.css';

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
        'system/rate-limit',
      );
      return {
        rateLimitFeatureRef,
        rateLimitOptions: {},
      };
    });
  },
});
