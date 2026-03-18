import {
  authConfigSpec,
  createPluginModule,
  pluginConfigSpec,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { AuthPluginDefinition } from './schema/plugin-definition.js';

import { AUTH_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { createAuthPluginDefinitionSchema } from './schema/plugin-definition.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    authConfig: authConfigSpec,
  },
  initialize: ({ authConfig, pluginConfig }, { pluginKey }) => {
    pluginConfig.schemas.set(pluginKey, createAuthPluginDefinitionSchema);
    pluginConfig.migrations.set(pluginKey, AUTH_PLUGIN_CONFIG_MIGRATIONS);
    authConfig.pluginKey.set(pluginKey);
    authConfig.getAuthConfig.set((definition) => {
      const pluginConfig = PluginUtils.configByKeyOrThrow(
        definition,
        pluginKey,
      ) as AuthPluginDefinition;
      return {
        roles: pluginConfig.roles,
      };
    });
  },
});
