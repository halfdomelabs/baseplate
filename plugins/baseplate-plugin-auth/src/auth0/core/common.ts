import {
  authConfigSpec,
  createPlatformPluginExport,
  pluginConfigSpec,
  PluginUtils,
} from '@halfdomelabs/project-builder-lib';

import type { Auth0PluginDefinition } from './schema/plugin-definition';

import { auth0PluginDefinitionSchema } from './schema/plugin-definition';

export default createPlatformPluginExport({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {
    authConfig: authConfigSpec,
  },
  initialize: ({ config }, { pluginId }) => {
    config.registerSchema(pluginId, auth0PluginDefinitionSchema);
    return {
      authConfig: {
        getUserAccountModel: (definition) => {
          const pluginConfig = PluginUtils.configByIdOrThrow(
            definition,
            pluginId,
          ) as Auth0PluginDefinition;
          return pluginConfig.userAccountModelRef;
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
