import {
  createPluginModule,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { createBullmqPluginDefinitionSchema } from './schema/plugin-definition.js';

// necessary for Typescript to infer the return type of the initialize function
export type { PluginModule } from '@baseplate-dev/project-builder-lib';

export default createPluginModule({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {},
  initialize: ({ config }, { pluginKey }) => {
    config.registerSchemaCreator(pluginKey, createBullmqPluginDefinitionSchema);
    return {};
  },
});
