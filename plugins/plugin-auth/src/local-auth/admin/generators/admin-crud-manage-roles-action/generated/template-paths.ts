import { reactRoutesProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface LocalAuthAdminAdminCrudManageRolesActionPaths {
  roleManagerDialog: string;
}

const localAuthAdminAdminCrudManageRolesActionPaths =
  createProviderType<LocalAuthAdminAdminCrudManageRolesActionPaths>(
    'local-auth-admin-admin-crud-manage-roles-action-paths',
  );

const localAuthAdminAdminCrudManageRolesActionPathsTask = createGeneratorTask({
  dependencies: { reactRoutes: reactRoutesProvider },
  exports: {
    localAuthAdminAdminCrudManageRolesActionPaths:
      localAuthAdminAdminCrudManageRolesActionPaths.export(),
  },
  run({ reactRoutes }) {
    const routesRoot = reactRoutes.getOutputRelativePath();

    return {
      providers: {
        localAuthAdminAdminCrudManageRolesActionPaths: {
          roleManagerDialog: `${routesRoot}/-components/role-manager-dialog.tsx`,
        },
      },
    };
  },
});

export const LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_PATHS = {
  provider: localAuthAdminAdminCrudManageRolesActionPaths,
  task: localAuthAdminAdminCrudManageRolesActionPathsTask,
};
