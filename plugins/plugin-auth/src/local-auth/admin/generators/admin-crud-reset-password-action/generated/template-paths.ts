import { reactRoutesProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface LocalAuthAdminAdminCrudResetPasswordActionPaths {
  passwordResetDialog: string;
  passwordResetDialogGql: string;
}

const localAuthAdminAdminCrudResetPasswordActionPaths =
  createProviderType<LocalAuthAdminAdminCrudResetPasswordActionPaths>(
    'local-auth-admin-admin-crud-reset-password-action-paths',
  );

const localAuthAdminAdminCrudResetPasswordActionPathsTask = createGeneratorTask(
  {
    dependencies: { reactRoutes: reactRoutesProvider },
    exports: {
      localAuthAdminAdminCrudResetPasswordActionPaths:
        localAuthAdminAdminCrudResetPasswordActionPaths.export(),
    },
    run({ reactRoutes }) {
      const routesRoot = reactRoutes.getOutputRelativePath();

      return {
        providers: {
          localAuthAdminAdminCrudResetPasswordActionPaths: {
            passwordResetDialog: `${routesRoot}/-components/password-reset-dialog.tsx`,
            passwordResetDialogGql: `${routesRoot}/-components/password-reset-dialog.gql`,
          },
        },
      };
    },
  },
);

export const LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_PATHS = {
  provider: localAuthAdminAdminCrudResetPasswordActionPaths,
  task: localAuthAdminAdminCrudResetPasswordActionPathsTask,
};
