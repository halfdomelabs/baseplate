import type { PluginModule } from '@baseplate-dev/project-builder-lib';

import {
  adminCrudActionSpec,
  adminCrudColumnSpec,
  createAdminCrudActionType,
  createAdminCrudColumnType,
  createPluginModule,
} from '@baseplate-dev/project-builder-lib';

import { createAdminCrudManageRolesActionSchema } from './schema/manage-role-action.js';
import { createAdminCrudResetPasswordActionSchema } from './schema/reset-password-action.js';
import { createAdminCrudRolesColumnSchema } from './schema/roles-column.js';

export default createPluginModule({
  dependencies: {
    adminCrudAction: adminCrudActionSpec,
    adminCrudColumn: adminCrudColumnSpec,
  },
  exports: {},
  initialize: ({ adminCrudAction, adminCrudColumn }) => {
    // Register the manage-roles action type
    adminCrudAction.registerAdminCrudAction(
      createAdminCrudActionType({
        name: 'manage-roles',
        createSchema: createAdminCrudManageRolesActionSchema,
      }),
    );

    // Register the reset-password action type
    adminCrudAction.registerAdminCrudAction(
      createAdminCrudActionType({
        name: 'reset-password',
        createSchema: createAdminCrudResetPasswordActionSchema,
      }),
    );

    // Register the roles column type
    adminCrudColumn.registerAdminCrudColumn(
      createAdminCrudColumnType({
        name: 'roles',
        createSchema: createAdminCrudRolesColumnSchema,
      }),
    );

    return {};
  },
}) as PluginModule;
