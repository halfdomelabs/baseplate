import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const authRoles = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'auth-roles',
  projectExports: {
    AUTH_ROLE_CONFIG: {},
    AuthRole: { isTypeOnly: true },
    DEFAULT_PUBLIC_ROLES: {},
    DEFAULT_USER_ROLES: {},
    RoleConfig: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/constants/auth-roles.constants.ts',
    ),
  },
  variables: { TPL_AUTH_ROLES: {} },
});

export const AUTH_AUTH_ROLES_TEMPLATES = { authRoles };
