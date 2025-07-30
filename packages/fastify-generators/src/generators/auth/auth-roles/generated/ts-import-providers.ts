import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { AUTH_AUTH_ROLES_PATHS } from './template-paths.js';

const authRolesImportsSchema = createTsImportMapSchema({
  AUTH_ROLE_CONFIG: {},
  AuthRole: { isTypeOnly: true },
  DEFAULT_PUBLIC_ROLES: {},
  DEFAULT_USER_ROLES: {},
  RoleConfig: { isTypeOnly: true },
});

export type AuthRolesImportsProvider = TsImportMapProviderFromSchema<
  typeof authRolesImportsSchema
>;

export const authRolesImportsProvider =
  createReadOnlyProviderType<AuthRolesImportsProvider>('auth-roles-imports');

const authAuthRolesImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_AUTH_ROLES_PATHS.provider,
  },
  exports: { authRolesImports: authRolesImportsProvider.export(packageScope) },
  run({ paths }) {
    return {
      providers: {
        authRolesImports: createTsImportMap(authRolesImportsSchema, {
          AUTH_ROLE_CONFIG: paths.authRoles,
          AuthRole: paths.authRoles,
          DEFAULT_PUBLIC_ROLES: paths.authRoles,
          DEFAULT_USER_ROLES: paths.authRoles,
          RoleConfig: paths.authRoles,
        }),
      },
    };
  },
});

export const AUTH_AUTH_ROLES_IMPORTS = {
  task: authAuthRolesImportsTask,
};
