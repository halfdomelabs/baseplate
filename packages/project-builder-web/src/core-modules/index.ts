import type { PluginModuleWithKey } from '@baseplate-dev/project-builder-lib';

import { actionWebConfigsCoreModule } from './action-web-configs.js';
import { columnWebConfigsCoreModule } from './column-web-configs.js';
import { entityTypeUrlsCoreModule } from './entity-type-urls-core-module.js';
import { inputWebConfigsCoreModule } from './input-web-configs.js';
import { libraryTypeWebConfigsCoreModule } from './library-type-web-configs.js';
import { transformerWebConfigsCoreModule } from './transformer-web-configs.js';

export const WEB_CORE_MODULES: PluginModuleWithKey[] = [
  columnWebConfigsCoreModule,
  actionWebConfigsCoreModule,
  transformerWebConfigsCoreModule,
  inputWebConfigsCoreModule,
  libraryTypeWebConfigsCoreModule,
  entityTypeUrlsCoreModule,
].map((mod) => ({
  key: `core/web/${mod.name}`,
  pluginKey: 'core',
  module: mod,
}));
