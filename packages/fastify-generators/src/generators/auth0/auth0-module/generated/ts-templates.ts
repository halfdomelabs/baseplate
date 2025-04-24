import { createTsTemplateFile } from '@halfdomelabs/core-generators';

import { authContextImportsProvider } from '../../../auth/auth-context/generated/ts-import-maps.js';
import { authRolesImportsProvider } from '../../../auth/auth-roles/generated/ts-import-maps.js';
import { userSessionTypesImportsProvider } from '../../../auth/user-session-types/generated/ts-import-maps.js';
import { configServiceImportsProvider } from '../../../core/config-service/generated/ts-import-maps.js';

const management = createTsTemplateFile({
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'management',
  projectExports: {},
  source: { path: 'management.ts' },
  variables: {},
});

const userSessionService = createTsTemplateFile({
  importMapProviders: {
    authContextImports: authContextImportsProvider,
    authRolesImports: authRolesImportsProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  name: 'user-session-service',
  projectExports: { userSessionService: {} },
  source: { path: 'user-session.service.ts' },
  variables: { TPL_USER_MODEL: {} },
});

export const AUTH_0_AUTH_0_MODULE_TS_TEMPLATES = {
  management,
  userSessionService,
};
