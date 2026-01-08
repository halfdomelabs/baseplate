import {
  createPluginModule,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { Auth0DefinitionEditor } from './components/auth0-definition-editor.js';

import '../../styles.css';

export default createPluginModule({
  dependencies: {
    webConfig: webConfigSpec,
  },
  exports: {},
  initialize: ({ webConfig }, { pluginKey }) => {
    webConfig.registerWebConfigComponent(pluginKey, Auth0DefinitionEditor);
    return {};
  },
});
