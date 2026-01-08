import {
  authModelsSpec,
  createPluginModule,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { AUTH0_MODELS } from '../constants/model-names.js';
import { AUTH0_PLUGIN_CONFIG_MIGRATIONS } from './schema/migrations.js';
import { createAuth0PluginDefinitionSchema } from './schema/plugin-definition.js';

// necessary for Typescript to infer the return type of the initialize function
export type { PluginModule } from '@baseplate-dev/project-builder-lib';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    authModels: authModelsSpec,
  },
  initialize: ({ pluginConfig, authModels }, { pluginKey }) => {
    pluginConfig.schemas.set(pluginKey, createAuth0PluginDefinitionSchema);
    pluginConfig.migrations.set(pluginKey, AUTH0_PLUGIN_CONFIG_MIGRATIONS);

    authModels.getAuthModels.set(() => ({
      user: AUTH0_MODELS.user,
    }));
  },
});
