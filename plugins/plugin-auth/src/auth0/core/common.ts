import {
  authConfigSpec,
  createPlatformPluginExport,
  pluginConfigSpec,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { Auth0PluginDefinition } from './schema/plugin-definition.js';

import { AUTH0_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { createAuth0PluginDefinitionSchema } from './schema/plugin-definition.js';

// necessary for Typescript to infer the return type of the initialize function
export type { PluginPlatformModule } from '@baseplate-dev/project-builder-lib';

export default createPlatformPluginExport({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {
    authConfig: authConfigSpec,
  },
  initialize: ({ config }, { pluginKey }) => {
    config.registerSchemaCreator(pluginKey, createAuth0PluginDefinitionSchema);
    config.registerMigrations(pluginKey, AUTH0_PLUGIN_CONFIG_MIGRATIONS);
    return {
      authConfig: {
        getUserModel: (definition) => {
          const pluginConfig = PluginUtils.configByKeyOrThrow(
            definition,
            pluginKey,
          ) as Auth0PluginDefinition;
          return pluginConfig.modelRefs.user;
        },
        getAuthRoles: (definition) => {
          const pluginConfig = PluginUtils.configByKeyOrThrow(
            definition,
            pluginKey,
          ) as Auth0PluginDefinition;
          return pluginConfig.roles;
        },
      },
    };
  },
});
