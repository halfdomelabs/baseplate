import {
  createPluginModule,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { SentryDefinitionEditor } from './components/sentry-definition-editor.js';

import '../../styles.css';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
    pluginDefaults: pluginDefaultsSpec,
  },
  initialize: ({ webConfig, pluginDefaults }, { pluginKey }) => {
    webConfig.components.set(pluginKey, SentryDefinitionEditor);
    pluginDefaults.builders.set(pluginKey, () => ({
      sentryOptions: {},
    }));
  },
});
