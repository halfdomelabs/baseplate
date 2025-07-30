import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  passwordHasherServiceImportsProvider,
  pothosImportsProvider,
  prismaImportsProvider,
  requestServiceContextImportsProvider,
  userSessionServiceImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { authModuleImportsProvider } from '#src/local-auth/core/generators/auth-module/generated/ts-import-providers.js';

const constantsPassword = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: {},
  name: 'constants-password',
  projectExports: { PASSWORD_MIN_LENGTH: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/constants/password.constants.ts',
    ),
  },
  variables: {},
});

const schemaUserPasswordMutations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: {
    authModuleImports: authModuleImportsProvider,
    pothosImports: pothosImportsProvider,
  },
  name: 'schema-user-password-mutations',
  referencedGeneratorTemplates: { servicesUserPassword: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/user-password.mutations.ts',
    ),
  },
  variables: {},
});

const servicesUserPassword = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    passwordHasherServiceImports: passwordHasherServiceImportsProvider,
    prismaImports: prismaImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
    userSessionServiceImports: userSessionServiceImportsProvider,
    userSessionTypesImports: userSessionTypesImportsProvider,
  },
  name: 'services-user-password',
  projectExports: {
    authenticateUserWithEmailAndPassword: {},
    createUserWithEmailAndPassword: {},
    registerUserWithEmailAndPassword: {},
  },
  referencedGeneratorTemplates: { constantsPassword: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/user-password.service.ts',
    ),
  },
  variables: {},
});

export const moduleGroup = {
  constantsPassword,
  schemaUserPasswordMutations,
  servicesUserPassword,
};

export const LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES = { moduleGroup };
