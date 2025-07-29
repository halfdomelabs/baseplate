import {
  authModelConfigSpec,
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
    authModelConfig: authModelConfigSpec,
  },
  initialize: ({ config }, { pluginKey }) => {
    config.registerSchemaCreator(
      pluginKey,
      createPlaceholderAuthPluginDefinitionSchema,
    );
    return {
      authModelConfig: {
        getUserModel: (definition) => {
          const pluginConfig = PluginUtils.configByKeyOrThrow(
            definition,
            pluginKey,
          ) as PlaceholderAuthPluginDefinition;
          return pluginConfig.modelRefs.user;
        },
      },
    };
  },
});
