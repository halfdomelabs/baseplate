import {
  createPluginModule,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { StorageDefinitionEditor } from './components/storage-definition-editor.js';

import '../../styles.css';

export default createPluginModule({
  dependencies: {
    webConfig: webConfigSpec,
  },
  exports: {},
  initialize: ({ webConfig }, { pluginKey }) => {
    webConfig.registerWebConfigComponent(pluginKey, StorageDefinitionEditor);
    return {};
  },
});
