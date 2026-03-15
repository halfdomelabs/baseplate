import { reactRoutesProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface BetterAuthAdminAdminCrudResetPasswordActionPaths {
  passwordResetDialog: string;
}

const betterAuthAdminAdminCrudResetPasswordActionPaths =
  createProviderType<BetterAuthAdminAdminCrudResetPasswordActionPaths>(
    'better-auth-admin-admin-crud-reset-password-action-paths',
  );

const betterAuthAdminAdminCrudResetPasswordActionPathsTask =
  createGeneratorTask({
    dependencies: { reactRoutes: reactRoutesProvider },
    exports: {
      betterAuthAdminAdminCrudResetPasswordActionPaths:
        betterAuthAdminAdminCrudResetPasswordActionPaths.export(),
    },
    run({ reactRoutes }) {
      const routesRoot = reactRoutes.getOutputRelativePath();

      return {
        providers: {
          betterAuthAdminAdminCrudResetPasswordActionPaths: {
            passwordResetDialog: `${routesRoot}/-components/password-reset-dialog.tsx`,
          },
        },
      };
    },
  });

export const BETTER_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_PATHS = {
  provider: betterAuthAdminAdminCrudResetPasswordActionPaths,
  task: betterAuthAdminAdminCrudResetPasswordActionPathsTask,
};
