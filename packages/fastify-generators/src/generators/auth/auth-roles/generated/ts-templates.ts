import { createTsTemplateFile } from '@halfdomelabs/core-generators';

const authRoles = createTsTemplateFile({
  name: 'auth-roles',
  projectExports: {
    AuthRole: { isTypeOnly: true },
    DEFAULT_PUBLIC_ROLES: {},
    DEFAULT_USER_ROLES: {},
    RoleConfig: { isTypeOnly: true },
  },
  source: { path: 'auth-roles.constants.ts' },
  variables: { TPL_AUTH_ROLES: {} },
});

export const AUTH_AUTH_ROLES_TS_TEMPLATES = { authRoles };
