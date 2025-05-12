import {
  createPlatformPluginExport,
  webConfigSpec,
} from '@halfdomelabs/project-builder-lib';

import { StorageConfig } from './components/StorageConfig';

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
