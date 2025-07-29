import {
  authConfigSpec,
  createPlatformPluginExport,
  pluginConfigSpec,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { AuthPluginDefinition } from './schema/plugin-definition.js';

import { createAuthPluginDefinitionSchema } from './schema/plugin-definition.js';

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
    config.registerSchemaCreator(pluginKey, createAuthPluginDefinitionSchema);
    return {
      authConfig: {
        getAuthRoles: (definition) => {
          const pluginConfig = PluginUtils.configByKeyOrThrow(
            definition,
            pluginKey,
          ) as AuthPluginDefinition;
          return pluginConfig.roles;
        },
      },
    };
  },
});
