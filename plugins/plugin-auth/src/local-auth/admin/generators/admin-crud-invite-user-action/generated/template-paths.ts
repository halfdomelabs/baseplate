import { reactRoutesProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface LocalAuthAdminAdminCrudInviteUserActionPaths {
  inviteUserDialog: string;
}

const localAuthAdminAdminCrudInviteUserActionPaths =
  createProviderType<LocalAuthAdminAdminCrudInviteUserActionPaths>(
    'local-auth-admin-admin-crud-invite-user-action-paths',
  );

const localAuthAdminAdminCrudInviteUserActionPathsTask = createGeneratorTask({
  dependencies: { reactRoutes: reactRoutesProvider },
  exports: {
    localAuthAdminAdminCrudInviteUserActionPaths:
      localAuthAdminAdminCrudInviteUserActionPaths.export(),
  },
  run({ reactRoutes }) {
    const routesRoot = reactRoutes.getOutputRelativePath();

    return {
      providers: {
        localAuthAdminAdminCrudInviteUserActionPaths: {
          inviteUserDialog: `${routesRoot}/-components/invite-user-dialog.tsx`,
        },
      },
    };
  },
});

export const LOCAL_AUTH_ADMIN_ADMIN_CRUD_INVITE_USER_ACTION_PATHS = {
  provider: localAuthAdminAdminCrudInviteUserActionPaths,
  task: localAuthAdminAdminCrudInviteUserActionPathsTask,
};
