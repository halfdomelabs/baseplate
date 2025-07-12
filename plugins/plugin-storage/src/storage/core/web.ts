import {
  createPlatformPluginExport,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { StorageDefinitionEditor } from './components/storage-definition-editor.js';

import '../../styles.css';

export default createPlatformPluginExport({
  dependencies: {
    webConfig: webConfigSpec,
  },
  exports: {},
  initialize: ({ webConfig }, { pluginId }) => {
    webConfig.registerWebConfigComponent(pluginId, StorageDefinitionEditor);
    return {};
  },
});
