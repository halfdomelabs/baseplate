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
  name: 'common',
  dependencies: {
    adminCrudAction: adminCrudActionSpec,
    adminCrudColumn: adminCrudColumnSpec,
  },
  initialize: ({ adminCrudAction, adminCrudColumn }) => {
    // Register the manage-roles action type
    adminCrudAction.actions.add(
      createAdminCrudActionType({
        name: 'manage-roles',
        createSchema: createAdminCrudManageRolesActionSchema,
      }),
    );

    // Register the reset-password action type
    adminCrudAction.actions.add(
      createAdminCrudActionType({
        name: 'reset-password',
        createSchema: createAdminCrudResetPasswordActionSchema,
      }),
    );

    // Register the roles column type
    adminCrudColumn.columns.add(
      createAdminCrudColumnType({
        name: 'roles',
        createSchema: createAdminCrudRolesColumnSchema,
      }),
    );
  },
});
