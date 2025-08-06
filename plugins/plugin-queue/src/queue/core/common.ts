import {
  createPlatformPluginExport,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { createQueuePluginDefinitionSchema } from './schema/plugin-definition.js';

// necessary for Typescript to infer the return type of the initialize function
export type { PluginPlatformModule } from '@baseplate-dev/project-builder-lib';

export default createPlatformPluginExport({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {},
  initialize: ({ config }, { pluginKey }) => {
    config.registerSchemaCreator(pluginKey, createQueuePluginDefinitionSchema);
    return {};
  },
});
