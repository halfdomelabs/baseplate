import {
  adminCrudActionSpec,
  createAdminCrudActionType,
  createPlatformPluginExport,
} from '@baseplate-dev/project-builder-lib';

import { createAdminCrudManageRolesActionSchema } from './schema/manage-role-action.js';

export default createPlatformPluginExport({
  dependencies: {
    adminCrudAction: adminCrudActionSpec,
  },
  exports: {},
  initialize: ({ adminCrudAction }) => {
    adminCrudAction.registerAdminCrudAction(
      createAdminCrudActionType({
        name: 'manage-roles',
        createSchema: createAdminCrudManageRolesActionSchema,
      }),
    );
    return {};
  },
});
