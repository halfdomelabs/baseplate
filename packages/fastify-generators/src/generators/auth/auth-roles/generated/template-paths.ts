import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { appModuleProvider } from '#src/generators/core/app-module/app-module.generator.js';

export interface AuthAuthRolesPaths {
  authRoles: string;
}

const authAuthRolesPaths = createProviderType<AuthAuthRolesPaths>(
  'auth-auth-roles-paths',
);

const authAuthRolesPathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { authAuthRolesPaths: authAuthRolesPaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        authAuthRolesPaths: {
          authRoles: `${moduleRoot}/constants/auth-roles.constants.ts`,
        },
      },
    };
  },
});

export const AUTH_AUTH_ROLES_PATHS = {
  provider: authAuthRolesPaths,
  task: authAuthRolesPathsTask,
};
