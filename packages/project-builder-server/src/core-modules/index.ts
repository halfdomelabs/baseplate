import type {
  PluginModule,
  PluginModuleWithKey,
} from '@baseplate-dev/project-builder-lib';

import { adminCrudActionCoreModule } from './admin-crud-action-compiler.js';
import { adminCrudColumnCoreModule } from './admin-crud-column-compiler.js';
import { adminCrudInputCoreModule } from './admin-crud-input-compiler.js';
import { modelTransformerCoreModule } from './model-transformer-compiler.js';

export const SERVER_CORE_MODULES: PluginModuleWithKey[] = [
  adminCrudActionCoreModule,
  modelTransformerCoreModule,
  adminCrudColumnCoreModule,
  adminCrudInputCoreModule,
].map((module) => ({
  key: `core/server/${module.name}`,
  pluginKey: 'core',
  module: module as PluginModule,
}));
