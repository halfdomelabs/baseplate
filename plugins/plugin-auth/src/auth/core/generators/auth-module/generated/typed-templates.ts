import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authContextImportsProvider,
  authRolesImportsProvider,
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  pothosImportsProvider,
  requestServiceContextImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

const userSessionConstants = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'constants',
  importMapProviders: {},
  name: 'user-session-constants',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/constants/user-session.constants.ts',
    ),
  },
  variables: {},
});

export const constantsGroup = { userSessionConstants };

const schemaUserSessionMutations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-user-session-mutations',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/user-session.mutations.ts',
    ),
  },
  variables: {},
});

const schemaUserSessionPayloadObjectType = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-user-session-payload-object-type',
  projectExports: { userSessionPayload: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/user-session-payload.object-type.ts',
    ),
  },
  variables: { TPL_PRISMA_USER: {}, TPL_USER_OBJECT_TYPE: {} },
});

const schemaUserSessionQueries = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-user-session-queries',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/user-session.queries.ts',
    ),
  },
  variables: {},
});

export const moduleGroup = {
  schemaUserSessionMutations,
  schemaUserSessionPayloadObjectType,
  schemaUserSessionQueries,
};

const userSessionService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authContextImports: authContextImportsProvider,
    authRolesImports: authRolesImportsProvider,
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
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
  variables: { TPL_PRISMA_USER_SESSION: {} },
});

const cookieSigner = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {},
  name: 'cookie-signer',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/utils/cookie-signer.ts',
    ),
  },
  variables: {},
});

const sessionCookie = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'session-cookie',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/utils/session-cookie.ts',
    ),
  },
  variables: {},
});

const verifyRequestOrigin = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {},
  name: 'verify-request-origin',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/utils/verify-request-origin.ts',
    ),
  },
  variables: {},
});

export const utilsGroup = { cookieSigner, sessionCookie, verifyRequestOrigin };

export const AUTH_CORE_AUTH_MODULE_TEMPLATES = {
  constantsGroup,
  moduleGroup,
  utilsGroup,
  userSessionService,
};
