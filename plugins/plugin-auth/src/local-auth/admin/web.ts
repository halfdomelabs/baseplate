import {
  createPluginModule,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  adminCrudActionWebSpec,
  adminCrudColumnWebSpec,
} from '@baseplate-dev/project-builder-lib/web';

import { LOCAL_AUTH_MODELS } from '#src/local-auth/constants/model-names.js';

export default createPluginModule({
  name: 'web',
  dependencies: {
    adminCrudActionWeb: adminCrudActionWebSpec,
    adminCrudColumnWeb: adminCrudColumnWebSpec,
  },
  initialize: ({ adminCrudActionWeb, adminCrudColumnWeb }, { pluginKey }) => {
    adminCrudActionWeb.actions.addMany([
      {
        pluginKey,
        name: 'manage-roles',
        label: 'Manage Roles',
        isAvailableForModel: (definition, modelId) =>
          ModelUtils.byIdOrThrow(definition, modelId).name ===
          LOCAL_AUTH_MODELS.user,
        getNewAction: () => ({ type: 'manage-roles', position: 'dropdown' }),
      },
      {
        pluginKey,
        name: 'reset-password',
        label: 'Reset Password',
        isAvailableForModel: (definition, modelId) =>
          ModelUtils.byIdOrThrow(definition, modelId).name ===
          LOCAL_AUTH_MODELS.user,
        getNewAction: () => ({ type: 'reset-password', position: 'dropdown' }),
      },
    ]);

    adminCrudColumnWeb.columns.add({
      pluginKey,
      name: 'roles',
      label: 'Roles',
      isAvailableForModel: (definition, modelId) =>
        ModelUtils.byIdOrThrow(definition, modelId).name ===
        LOCAL_AUTH_MODELS.user,
      getNewColumn: () => ({ type: 'roles', label: 'Roles' }),
    });
  },
});
