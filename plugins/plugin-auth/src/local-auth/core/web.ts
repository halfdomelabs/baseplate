import {
  createPluginModule,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { LocalAuthDefinitionEditor } from './components/local-auth-definition-editor.js';

import '../../styles.css';

export default createPluginModule({
  dependencies: {
    webConfig: webConfigSpec,
  },
  exports: {},
  initialize: ({ webConfig }, { pluginKey }) => {
    webConfig.registerWebConfigComponent(pluginKey, LocalAuthDefinitionEditor);
    return {};
  },
});
