import { pluginEntityType } from '@src/schema/plugins/index.js';

import { transformJsonPath } from './transform-json-path.js';
import { createSchemaMigration } from './types.js';

export const migration011PluginId = createSchemaMigration<
  Record<string, unknown>,
  unknown
>({
  version: 11,
  name: 'pluginId',
  description: 'Convert plugin ids to use the plugin entity type',
  migrate: (config) =>
    transformJsonPath(config, 'plugins.*.id', (id: string) =>
      pluginEntityType.fromUid(id),
    ),
});
