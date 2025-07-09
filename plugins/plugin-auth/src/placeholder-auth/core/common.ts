import {
  authConfigSpec,
  createPlatformPluginExport,
  pluginConfigSpec,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { PlaceholderAuthPluginDefinition } from './schema/plugin-definition.js';

import { createPlaceholderAuthPluginDefinitionSchema } from './schema/plugin-definition.js';

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
    config.registerSchemaCreator(
      pluginId,
      createPlaceholderAuthPluginDefinitionSchema,
    );
    return {
      authConfig: {
        getUserModel: (definition) => {
          const pluginConfig = PluginUtils.configByIdOrThrow(
            definition,
            pluginId,
          ) as PlaceholderAuthPluginDefinition;
          return pluginConfig.modelRefs.user;
        },
        getAuthRoles: (definition) => {
          const pluginConfig = PluginUtils.configByIdOrThrow(
            definition,
            pluginId,
          ) as PlaceholderAuthPluginDefinition;
          return pluginConfig.roles;
        },
      },
    };
  },
});
