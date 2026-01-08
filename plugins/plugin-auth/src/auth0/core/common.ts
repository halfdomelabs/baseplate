import {
  authModelConfigSpec,
  createPluginModule,
  ModelUtils,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { AUTH0_MODELS } from '../constants/model-names.js';
import { AUTH0_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { createAuth0PluginDefinitionSchema } from './schema/plugin-definition.js';

// necessary for Typescript to infer the return type of the initialize function
export type { PluginModule } from '@baseplate-dev/project-builder-lib';

export default createPluginModule({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {
    authModelConfig: authModelConfigSpec,
  },
  initialize: ({ config }, { pluginKey }) => {
    config.registerSchemaCreator(pluginKey, createAuth0PluginDefinitionSchema);
    config.registerMigrations(pluginKey, AUTH0_PLUGIN_CONFIG_MIGRATIONS);
    return {
      authModelConfig: {
        getUserModel: (definition) =>
          ModelUtils.byNameOrThrow(definition, AUTH0_MODELS.user),
      },
    };
  },
});
