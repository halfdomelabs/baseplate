import {
  createPluginModule,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { QueueDefinitionEditor } from './components/queue-definition-editor.js';

import '../../styles.css';

export default createPluginModule({
  dependencies: {
    webConfig: webConfigSpec,
  },
  exports: {},
  initialize: ({ webConfig }, { pluginKey }) => {
    webConfig.registerWebConfigComponent(pluginKey, QueueDefinitionEditor);
    return {};
  },
});
