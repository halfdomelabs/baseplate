import {
  createPlatformPluginExport,
  pluginConfigSpec,
} from '@halfdomelabs/project-builder-lib';

import { storagePluginDefinitionSchema } from './schema/plugin-definition.js';

export default createPlatformPluginExport({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {},
  initialize: ({ config }, { pluginId }) => {
    config.registerSchema(pluginId, storagePluginDefinitionSchema);
    return {};
  },
});
