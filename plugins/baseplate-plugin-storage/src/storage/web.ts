import {
  createPlatformPluginExport,
  webConfigSpec,
} from '@halfdomelabs/project-builder-lib';

import { StorageConfig } from './components/StorageConfig';

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
