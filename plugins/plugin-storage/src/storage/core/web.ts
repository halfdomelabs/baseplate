import {
  createPlatformPluginExport,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { StorageConfig } from './components/storage-config.js';

import '../../styles.css';

export default createPlatformPluginExport({
  dependencies: {
    webConfig: webConfigSpec,
  },
  exports: {},
  initialize: ({ webConfig }, { pluginId }) => {
    webConfig.registerWebConfigComponent(pluginId, StorageConfig);
    return {};
  },
});
