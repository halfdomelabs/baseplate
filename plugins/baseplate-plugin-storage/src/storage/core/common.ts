import {
  createPlatformPluginExport,
  pluginConfigSpec,
} from '@halfdomelabs/project-builder-lib';

import { STORAGE_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations';
import { storagePluginDefinitionSchema } from './schema/plugin-definition';

export default createPlatformPluginExport({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {},
  initialize: ({ config }, { pluginId }) => {
    config.registerSchema(pluginId, storagePluginDefinitionSchema);
    config.registerMigrations(pluginId, STORAGE_PLUGIN_CONFIG_MIGRATIONS);
    return {};
  },
});
