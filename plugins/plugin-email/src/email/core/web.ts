import {
  createPluginModule,
  FeatureUtils,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { EmailDefinitionEditor } from './components/email-definition-editor.js';

import '../../styles.css';

const EMAIL_FEATURE_NAME = 'emails';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
    pluginDefaults: pluginDefaultsSpec,
  },
  initialize: ({ webConfig, pluginDefaults }, { pluginKey }) => {
    webConfig.components.set(pluginKey, EmailDefinitionEditor);
    pluginDefaults.builders.set(pluginKey, ({ draft }) => {
      const emailFeatureRef = FeatureUtils.ensureFeatureByNameRecursively(
        draft,
        EMAIL_FEATURE_NAME,
      );
      return {
        config: {
          emailFeatureRef,
          implementationPluginKey: '',
        },
      };
    });
  },
});
