import {
  authModelsSpec,
  createPluginModule,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { PLACEHOLDER_AUTH_MODELS } from '#src/placeholder-auth/constants/model-names.js';

import { createPlaceholderAuthPluginDefinitionSchema } from './schema/plugin-definition.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
    authModels: authModelsSpec,
  },
  initialize: ({ pluginConfig, authModels }, { pluginKey }) => {
    pluginConfig.schemas.set(
      pluginKey,
      createPlaceholderAuthPluginDefinitionSchema,
    );
    authModels.getAuthModels.set(() => ({
      user: PLACEHOLDER_AUTH_MODELS.user,
    }));
  },
});
