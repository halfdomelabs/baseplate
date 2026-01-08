import {
  createPluginModule,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { STORAGE_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { createStoragePluginDefinitionSchema } from './schema/plugin-definition.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
  },
  initialize: ({ pluginConfig }, { pluginKey }) => {
    pluginConfig.schemas.set(pluginKey, createStoragePluginDefinitionSchema);
    pluginConfig.migrations.set(pluginKey, STORAGE_PLUGIN_CONFIG_MIGRATIONS);
  },
});
