import {
  authConfigSpec,
  createPlatformPluginExport,
  pluginConfigSpec,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { AuthPluginDefinition } from './schema/plugin-definition.js';

import { authPluginDefinitionSchema } from './schema/plugin-definition.js';

// necessary for Typescript to infer the return type of the initialize function
export type { PluginPlatformModule } from '@baseplate-dev/project-builder-lib';

export default createPlatformPluginExport({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {
    authConfig: authConfigSpec,
  },
  initialize: ({ config }, { pluginId }) => {
    config.registerSchema(pluginId, authPluginDefinitionSchema);
    return {
      authConfig: {
        getUserModel: (definition) => {
          const pluginConfig = PluginUtils.configByIdOrThrow(
            definition,
            pluginId,
          ) as AuthPluginDefinition;
          return pluginConfig.modelRefs.user;
        },
        getAuthRoles: (definition) => {
          const pluginConfig = PluginUtils.configByIdOrThrow(
            definition,
            pluginId,
          ) as AuthPluginDefinition;
          return pluginConfig.roles;
        },
      },
    };
  },
});
