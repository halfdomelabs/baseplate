import {
  createPlatformPluginExport,
  pluginConfigSpec,
} from '@halfdomelabs/project-builder-lib';

import { storagePluginConfigSchema } from './schema/plugin-config';

export default createPlatformPluginExport({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {},
  initialize: ({ config }, { pluginId }) => {
    return config.registerSchema(pluginId, storagePluginConfigSchema);
  },
});
