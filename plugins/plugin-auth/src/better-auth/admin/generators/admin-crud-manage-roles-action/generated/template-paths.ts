import { reactRoutesProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface BetterAuthAdminAdminCrudManageRolesActionPaths {
  roleManagerDialog: string;
}

const betterAuthAdminAdminCrudManageRolesActionPaths =
  createProviderType<BetterAuthAdminAdminCrudManageRolesActionPaths>(
    'better-auth-admin-admin-crud-manage-roles-action-paths',
  );

const betterAuthAdminAdminCrudManageRolesActionPathsTask = createGeneratorTask({
  dependencies: { reactRoutes: reactRoutesProvider },
  exports: {
    betterAuthAdminAdminCrudManageRolesActionPaths:
      betterAuthAdminAdminCrudManageRolesActionPaths.export(),
  },
  run({ reactRoutes }) {
    const routesRoot = reactRoutes.getOutputRelativePath();

    return {
      providers: {
        betterAuthAdminAdminCrudManageRolesActionPaths: {
          roleManagerDialog: `${routesRoot}/-components/role-manager-dialog.tsx`,
        },
      },
    };
  },
});

export const BETTER_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_PATHS = {
  provider: betterAuthAdminAdminCrudManageRolesActionPaths,
  task: betterAuthAdminAdminCrudManageRolesActionPathsTask,
};
