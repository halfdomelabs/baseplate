import {
  authConfigSpec,
  createPlatformPluginExport,
  pluginConfigSpec,
  PluginUtils,
} from '@halfdomelabs/project-builder-lib';

import type { Auth0PluginDefinition } from './schema/plugin-definition.js';

import { AUTH0_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { auth0PluginDefinitionSchema } from './schema/plugin-definition.js';

export default createPlatformPluginExport({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {
    authConfig: authConfigSpec,
  },
  initialize: ({ config }, { pluginId }) => {
    config.registerSchema(pluginId, auth0PluginDefinitionSchema);
    config.registerMigrations(pluginId, AUTH0_PLUGIN_CONFIG_MIGRATIONS);
    return {
      authConfig: {
        getUserModel: (definition) => {
          const pluginConfig = PluginUtils.configByIdOrThrow(
            definition,
            pluginId,
          ) as Auth0PluginDefinition;
          return pluginConfig.modelRefs.user;
        },
        getAuthRoles: (definition) => {
          const pluginConfig = PluginUtils.configByIdOrThrow(
            definition,
            pluginId,
          ) as Auth0PluginDefinition;
          return pluginConfig.roles;
        },
      },
    };
  },
});
