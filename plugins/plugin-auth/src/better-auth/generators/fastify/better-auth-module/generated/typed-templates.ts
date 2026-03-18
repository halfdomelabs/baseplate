import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authContextImportsProvider,
  authRolesImportsProvider,
  configServiceImportsProvider,
  pothosImportsProvider,
  prismaImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { emailModuleImportsProvider } from '@baseplate-dev/plugin-email';
import path from 'node:path';

const auth = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authRolesImports: authRolesImportsProvider,
    configServiceImports: configServiceImportsProvider,
    emailModuleImports: emailModuleImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'auth',
  projectExports: { auth: {}, cookiePrefix: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/auth.ts',
    ),
  },
  variables: {
    TPL_ACCOUNT_VERIFICATION_EMAIL: {},
    TPL_PASSWORD_RESET_EMAIL: {},
    TPL_USER_ROLE_MODEL: {},
  },
});

const betterAuthPlugin = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'better-auth-plugin',
  projectExports: { betterAuthPlugin: {} },
  referencedGeneratorTemplates: { auth: {}, headersUtils: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/plugins/better-auth.plugin.ts',
    ),
  },
  variables: {},
});

const headersUtils = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'headers-utils',
  projectExports: { toWebHeaders: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/utils/headers.utils.ts',
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
  variables: {},
});

const userSessionService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authContextImports: authContextImportsProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  name: 'user-session-service',
  projectExports: { userSessionService: {} },
  referencedGeneratorTemplates: { auth: {}, headersUtils: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/user-session.service.ts',
    ),
  },
  variables: {},
});

export const BETTER_AUTH_BETTER_AUTH_MODULE_TEMPLATES = {
  auth,
  betterAuthPlugin,
  headersUtils,
  userSessionQueries,
  userSessionService,
};
