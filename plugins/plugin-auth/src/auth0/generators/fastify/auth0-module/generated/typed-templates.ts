import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authContextImportsProvider,
  authRolesImportsProvider,
  configServiceImportsProvider,
  pothosImportsProvider,
  prismaImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

const management = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'management',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/management.ts',
    ),
  },
  variables: {},
});

const userSessionQueries = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    pothosImports: pothosImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'user-session-queries',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/user-session.queries.ts',
    ),
  },
  variables: { TPL_USER_OBJECT_TYPE: {} },
});

const userSessionService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authContextImports: authContextImportsProvider,
    authRolesImports: authRolesImportsProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  name: 'user-session-service',
  projectExports: { userSessionService: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/user-session.service.ts',
    ),
  },
  variables: { TPL_USER_MODEL: {} },
});

export const AUTH0_AUTH0_MODULE_TEMPLATES = {
  management,
  userSessionQueries,
  userSessionService,
};
