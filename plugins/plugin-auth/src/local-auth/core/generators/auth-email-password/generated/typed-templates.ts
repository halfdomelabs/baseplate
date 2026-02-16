import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  passwordHasherServiceImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
  requestServiceContextImportsProvider,
  userSessionServiceImportsProvider,
  userSessionTypesImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { emailModuleImportsProvider } from '@baseplate-dev/plugin-email';
import { queueServiceImportsProvider } from '@baseplate-dev/plugin-queue';
import { rateLimitImportsProvider } from '@baseplate-dev/plugin-rate-limit';
import path from 'node:path';

import { authModuleImportsProvider } from '#src/local-auth/core/generators/auth-module/generated/ts-import-providers.js';

const constantsPassword = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: {},
  name: 'constants-password',
  projectExports: {
    PASSWORD_MAX_LENGTH: {},
    PASSWORD_MIN_LENGTH: {},
    PASSWORD_RESET_TOKEN_EXPIRY_SEC: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/constants/password.constants.ts',
    ),
  },
  variables: {},
});

const schemaPasswordResetMutations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-password-reset-mutations',
  referencedGeneratorTemplates: { servicesPasswordReset: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/password-reset.mutations.ts',
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
  variables: { TPL_ADMIN_ROLES: {}, TPL_USER_OBJECT_TYPE: {} },
});

const servicesPasswordReset = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: {
    authModuleImports: authModuleImportsProvider,
    configServiceImports: configServiceImportsProvider,
    emailModuleImports: emailModuleImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    passwordHasherServiceImports: passwordHasherServiceImportsProvider,
    prismaImports: prismaImportsProvider,
    rateLimitImports: rateLimitImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
  },
  name: 'services-password-reset',
  projectExports: {
    cleanupExpiredPasswordResetTokens: { isTypeOnly: false },
    completePasswordReset: { isTypeOnly: false },
    requestPasswordReset: { isTypeOnly: false },
    validatePasswordResetToken: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: { constantsPassword: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/password-reset.service.ts',
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
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    rateLimitImports: rateLimitImportsProvider,
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
  referencedGeneratorTemplates: {
    constantsPassword: {},
    servicesEmailVerification: {},
  },
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
  schemaPasswordResetMutations,
  schemaUserPasswordMutations,
  servicesPasswordReset,
  servicesUserPassword,
};

const queuesCleanupAuthVerification = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authModuleImports: authModuleImportsProvider,
    queueServiceImports: queueServiceImportsProvider,
  },
  name: 'queues-cleanup-auth-verification',
  projectExports: { cleanupAuthVerificationQueue: { isTypeOnly: false } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/cleanup-auth-verification.queue.ts',
    ),
  },
  variables: {},
});

const schemaEmailVerificationMutations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-email-verification-mutations',
  referencedGeneratorTemplates: { servicesEmailVerification: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/email-verification.mutations.ts',
    ),
  },
  variables: {},
});

const servicesEmailVerification = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    authModuleImports: authModuleImportsProvider,
    configServiceImports: configServiceImportsProvider,
    emailModuleImports: emailModuleImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaImports: prismaImportsProvider,
    rateLimitImports: rateLimitImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
  },
  name: 'services-email-verification',
  referencedGeneratorTemplates: { constantsPassword: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/email-verification.service.ts',
    ),
  },
  variables: {},
});

export const LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_TEMPLATES = {
  moduleGroup,
  queuesCleanupAuthVerification,
  schemaEmailVerificationMutations,
  servicesEmailVerification,
};
