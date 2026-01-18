import {
  authModelsSpec,
  createPluginModule,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { LOCAL_AUTH_MODELS } from '#src/local-auth/constants/model-names.js';

import { createLocalAuthPluginDefinitionSchema } from './schema/plugin-definition.js';

// necessary for Typescript to infer the return type of the initialize function
export type { PluginModule } from '@baseplate-dev/project-builder-lib';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    authModels: authModelsSpec,
  },
  initialize: ({ pluginConfig, authModels }, { pluginKey }) => {
    pluginConfig.schemas.set(pluginKey, createLocalAuthPluginDefinitionSchema);
    authModels.getAuthModels.set(() => ({
      user: LOCAL_AUTH_MODELS.user,
    }));
  },
});
