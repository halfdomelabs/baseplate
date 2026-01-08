import type {
  PluginModule,
  PluginModuleWithKey,
} from '@baseplate-dev/project-builder-lib';

import { actionWebConfigsCoreModule } from './action-web-configs.js';
import { columnWebConfigsCoreModule } from './column-web-configs.js';
import { inputWebConfigsCoreModule } from './input-web-configs.js';
import { transformerWebConfigsCoreModule } from './transformer-web-configs.js';

export const WEB_CORE_MODULES: PluginModuleWithKey[] = [
  columnWebConfigsCoreModule,
  actionWebConfigsCoreModule,
  transformerWebConfigsCoreModule,
  inputWebConfigsCoreModule,
].map((mod) => ({
  key: `core/web/${mod.name}`,
  pluginKey: 'core',
  module: mod as PluginModule,
}));
