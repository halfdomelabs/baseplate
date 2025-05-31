import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authContextImportsProvider,
  authRolesImportsProvider,
  configServiceImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';

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
