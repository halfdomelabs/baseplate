import { createPlatformPluginExport } from '@baseplate-dev/project-builder-lib';
import {
  adminCrudActionWebSpec,
  adminCrudColumnWebSpec,
} from '@baseplate-dev/project-builder-lib/web';

import { LOCAL_AUTH_MODELS } from '#src/local-auth/constants/model-names.js';

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
      isAvailableForModel: (_, modelId) => modelId === LOCAL_AUTH_MODELS.user,
      getNewAction: () => ({ type: 'manage-roles', position: 'dropdown' }),
    });

    adminCrudActionWeb.registerActionWebConfig({
      pluginKey,
      name: 'reset-password',
      label: 'Reset Password',
      isAvailableForModel: (_, modelId) => modelId === LOCAL_AUTH_MODELS.user,
      getNewAction: () => ({ type: 'reset-password', position: 'dropdown' }),
    });

    adminCrudColumnWeb.registerColumnWebConfig({
      pluginKey,
      name: 'roles',
      label: 'Roles',
      isAvailableForModel: (_, modelId) => modelId === LOCAL_AUTH_MODELS.user,
      getNewColumn: () => ({ type: 'roles', label: 'Roles' }),
    });
    return {};
  },
});
