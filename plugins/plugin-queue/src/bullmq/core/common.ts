import {
  createPluginModule,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { createBullmqPluginDefinitionSchema } from './schema/plugin-definition.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    pluginConfig: pluginConfigSpec,
  },
  initialize: ({ pluginConfig }, { pluginKey }) => {
    pluginConfig.schemas.set(pluginKey, createBullmqPluginDefinitionSchema);
  },
});
