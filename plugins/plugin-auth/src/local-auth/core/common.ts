import {
  authModelConfigSpec,
  createPlatformPluginExport,
  ModelUtils,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { LOCAL_AUTH_MODELS } from '#src/local-auth/constants/model-names.js';

import { createLocalAuthPluginDefinitionSchema } from './schema/plugin-definition.js';

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
      createLocalAuthPluginDefinitionSchema,
    );
    return {
      authModelConfig: {
        getUserModel: (definition) =>
          ModelUtils.byNameOrThrow(definition, LOCAL_AUTH_MODELS.user),
      },
    };
  },
});
