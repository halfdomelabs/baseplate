import {
  createPlatformPluginExport,
  pluginConfigSpec,
} from '@halfdomelabs/project-builder-lib';

import { storagePluginDefinitionSchema } from './schema/plugin-definition';

export default createPlatformPluginExport({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {},
  initialize: ({ config }, { pluginId }) => {
    return config.registerSchema(pluginId, storagePluginDefinitionSchema);
  },
});
