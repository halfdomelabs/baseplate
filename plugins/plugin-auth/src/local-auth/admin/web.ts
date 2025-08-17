import {
  createPlatformPluginExport,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  adminCrudActionWebSpec,
  adminCrudColumnWebSpec,
} from '@baseplate-dev/project-builder-lib/web';

import type { LocalAuthPluginDefinition } from '../core/schema/plugin-definition.js';

export default createPlatformPluginExport({
  dependencies: {
    adminCrudActionWeb: adminCrudActionWebSpec,
    adminCrudColumnWeb: adminCrudColumnWebSpec,
  },
  exports: {},
  initialize: ({ adminCrudActionWeb, adminCrudColumnWeb }, { pluginKey }) => {
    adminCrudActionWeb.registerActionWebConfig({
      pluginKey,
      name: 'manage-roles',
      label: 'Manage Roles',
      isAvailableForModel: (definition, modelId) => {
        const pluginDefinition = PluginUtils.configByKeyOrThrow(
          definition,
          pluginKey,
        ) as LocalAuthPluginDefinition;
        return modelId === pluginDefinition.modelRefs.user;
      },
      getNewAction: () => ({ type: 'manage-roles', position: 'dropdown' }),
    });

    adminCrudActionWeb.registerActionWebConfig({
      pluginKey,
      name: 'reset-password',
      label: 'Reset Password',
      isAvailableForModel: (definition, modelId) => {
        const pluginDefinition = PluginUtils.configByKeyOrThrow(
          definition,
          pluginKey,
        ) as LocalAuthPluginDefinition;
        return modelId === pluginDefinition.modelRefs.user;
      },
      getNewAction: () => ({ type: 'reset-password', position: 'dropdown' }),
    });

    adminCrudColumnWeb.registerColumnWebConfig({
      pluginKey,
      name: 'roles',
      label: 'Roles',
      isAvailableForModel: (definition, modelId) => {
        const pluginDefinition = PluginUtils.configByKeyOrThrow(
          definition,
          pluginKey,
        ) as LocalAuthPluginDefinition;
        return modelId === pluginDefinition.modelRefs.user;
      },
      getNewColumn: () => ({ type: 'roles', label: 'Roles' }),
    });
    return {};
  },
});
