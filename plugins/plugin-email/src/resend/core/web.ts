import {
  createPluginModule,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { ResendDefinitionEditor } from './components/resend-definition-editor.js';

import '../../styles.css';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
  },
  initialize: ({ webConfig }, { pluginKey }) => {
    webConfig.components.set(pluginKey, ResendDefinitionEditor);
  },
});
