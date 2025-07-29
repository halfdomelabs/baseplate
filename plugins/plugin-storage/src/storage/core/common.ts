import {
  createPlatformPluginExport,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { STORAGE_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { createStoragePluginDefinitionSchema } from './schema/plugin-definition.js';

export default createPlatformPluginExport({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {},
  initialize: ({ config }, { pluginKey }) => {
    config.registerSchemaCreator(
      pluginKey,
      createStoragePluginDefinitionSchema,
    );
    config.registerMigrations(pluginKey, STORAGE_PLUGIN_CONFIG_MIGRATIONS);
    return {};
  },
});
