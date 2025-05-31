import {
  createPlatformPluginExport,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { STORAGE_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { storagePluginDefinitionSchema } from './schema/plugin-definition.js';

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
