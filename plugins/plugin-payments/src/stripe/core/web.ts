import {
  createPluginModule,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { StripeDefinitionEditor } from './components/stripe-definition-editor.js';

import '../../styles.css';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
    pluginDefaults: pluginDefaultsSpec,
  },
  initialize: ({ webConfig, pluginDefaults }, { pluginKey }) => {
    webConfig.components.set(pluginKey, StripeDefinitionEditor);
    pluginDefaults.builders.set(pluginKey, () => ({
      stripeOptions: {},
      billing: { enabled: false },
    }));
  },
});
