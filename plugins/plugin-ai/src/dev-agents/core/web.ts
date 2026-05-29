import {
  createPluginModule,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { DevAgentsDefinitionEditor } from './components/dev-agents-definition-editor.js';

import '../../styles.css';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
    pluginDefaults: pluginDefaultsSpec,
  },
  initialize: ({ webConfig, pluginDefaults }, { pluginKey }) => {
    webConfig.components.set(pluginKey, DevAgentsDefinitionEditor);
    pluginDefaults.builders.set(pluginKey, () => ({
      enabledAgents: ['claude-code'],
      devAgentsOptions: {},
    }));
  },
});
