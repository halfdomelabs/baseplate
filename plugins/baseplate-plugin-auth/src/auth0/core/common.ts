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
    authConfig: authConfigSpec,
  },
  exports: {},
  initialize: ({ config, authConfig }, { pluginId }) => {
    config.registerSchema(pluginId, auth0PluginDefinitionSchema);
    authConfig.registerUserAccountModelGetter(pluginId, (definition) => {
      const pluginConfig = PluginUtils.configByIdOrThrow(
        definition,
        pluginId,
      ) as Auth0PluginDefinition;
      return pluginConfig.userAccountModelRef;
    });
    return {};
  },
});
