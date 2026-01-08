import {
  authConfigSpec,
  createPluginModule,
  pluginConfigSpec,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { AuthPluginDefinition } from './schema/plugin-definition.js';

import { createAuthPluginDefinitionSchema } from './schema/plugin-definition.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    authConfig: authConfigSpec,
  },
  initialize: ({ authConfig, pluginConfig }, { pluginKey }) => {
    pluginConfig.schemas.set(pluginKey, createAuthPluginDefinitionSchema);
    authConfig.getAuthConfig.set((definition) => {
      const pluginConfig = PluginUtils.configByKeyOrThrow(
        definition,
        pluginKey,
      ) as AuthPluginDefinition;
      return {
        roles: pluginConfig.roles,
        modelNames: {
          user: pluginConfig.authFeatureRef,
        },
      };
    });
  },
});
