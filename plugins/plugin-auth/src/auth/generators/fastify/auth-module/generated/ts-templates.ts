import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@baseplate-dev/core-generators';
import {
  authContextImportsProvider,
  authRolesImportsProvider,
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  pothosImportsProvider,
  requestServiceContextImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';

const schemaUserSessionMutations = createTsTemplateFile({
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-user-session-mutations',
  projectExports: {},
  source: { path: 'schema/user-session.mutations.ts' },
  variables: {},
});

const schemaUserSessionQueries = createTsTemplateFile({
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-user-session-queries',
  projectExports: {},
  source: { path: 'schema/user-session.queries.ts' },
  variables: { TPL_PRISMA_USER: {} },
});

const userSessionPayloadObjectType = createTsTemplateFile({
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'user-session-payload-object-type',
  projectExports: { userSessionPayload: {} },
  source: { path: 'schema/user-session-payload.object-type.ts' },
  variables: { TPL_PRISMA_USER: {}, TPL_USER_OBJECT_TYPE: {} },
});

const schemaGroup = createTsTemplateGroup({
  templates: {
    schemaUserSessionMutations: {
      destination: 'user-session.mutations.ts',
      template: schemaUserSessionMutations,
    },
    schemaUserSessionQueries: {
      destination: 'user-session.queries.ts',
      template: schemaUserSessionQueries,
    },
    userSessionPayloadObjectType: {
      destination: 'user-session-payload.object-type.ts',
      template: userSessionPayloadObjectType,
    },
  },
});

const servicesUserSessionService = createTsTemplateFile({
  importMapProviders: {
    authContextImports: authContextImportsProvider,
    authRolesImports: authRolesImportsProvider,
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  name: 'services-user-session-service',
  projectExports: { userSessionService: {} },
  source: { path: 'services/user-session.service.ts' },
  variables: { TPL_PRISMA_USER_SESSION: {} },
});

const userSessionConstants = createTsTemplateFile({
  name: 'user-session-constants',
  projectExports: {
    USER_SESSION_DURATION_SEC: {},
    USER_SESSION_MAX_LIFETIME_SEC: {},
    USER_SESSION_RENEWAL_THRESHOLD_SEC: {},
  },
  source: { path: 'user-session.constants.ts' },
  variables: {},
});

const utilsCookieSigner = createTsTemplateFile({
  name: 'utils-cookie-signer',
  projectExports: { sign: {}, signObject: {}, unsign: {}, unsignObject: {} },
  source: { path: 'utils/cookie-signer.ts' },
  variables: {},
});

const utilsSessionCookie = createTsTemplateFile({
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'utils-session-cookie',
  projectExports: { getUserSessionCookieName: {} },
  source: { path: 'utils/session-cookie.ts' },
  variables: {},
});

const utilsVerifyRequestOrigin = createTsTemplateFile({
  name: 'utils-verify-request-origin',
  projectExports: { verifyRequestOrigin: {} },
  source: { path: 'utils/verify-request-origin.ts' },
  variables: {},
});

export const FASTIFY_AUTH_MODULE_TS_TEMPLATES = {
  schemaGroup,
  servicesUserSessionService,
  userSessionConstants,
  utilsCookieSigner,
  utilsSessionCookie,
  utilsVerifyRequestOrigin,
};
