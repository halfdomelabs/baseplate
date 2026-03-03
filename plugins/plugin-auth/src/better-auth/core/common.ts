import {
  authModelsSpec,
  createPluginModule,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { BETTER_AUTH_MODELS } from '../constants/model-names.js';
import { createBetterAuthPluginDefinitionSchema } from './schema/plugin-definition.js';

// necessary for Typescript to infer the return type of the initialize function
export type { PluginModule } from '@baseplate-dev/project-builder-lib';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    authModels: authModelsSpec,
  },
  initialize: ({ pluginConfig, authModels }, { pluginKey }) => {
    pluginConfig.schemas.set(pluginKey, createBetterAuthPluginDefinitionSchema);

    authModels.getAuthModels.set(() => ({
      user: BETTER_AUTH_MODELS.user,
    }));
  },
});
