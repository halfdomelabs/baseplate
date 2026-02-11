import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS } from './template-paths.js';

export const authEmailPasswordImportsSchema = createTsImportMapSchema({
  authenticateUserWithEmailAndPassword: {},
  cleanupExpiredPasswordResetTokens: {},
  completePasswordReset: {},
  createUserWithEmailAndPassword: {},
  PASSWORD_MAX_LENGTH: {},
  PASSWORD_MIN_LENGTH: {},
  PASSWORD_RESET_TOKEN_EXPIRY_SEC: {},
  registerUserWithEmailAndPassword: {},
  requestPasswordReset: {},
  validatePasswordResetToken: {},
});

export type AuthEmailPasswordImportsProvider = TsImportMapProviderFromSchema<
  typeof authEmailPasswordImportsSchema
>;

export const authEmailPasswordImportsProvider =
  createReadOnlyProviderType<AuthEmailPasswordImportsProvider>(
    'auth-email-password-imports',
  );

const localAuthCoreAuthEmailPasswordImportsTask = createGeneratorTask({
  dependencies: {
    paths: LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS.provider,
  },
  exports: {
    authEmailPasswordImports:
      authEmailPasswordImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        authEmailPasswordImports: createTsImportMap(
          authEmailPasswordImportsSchema,
          {
            authenticateUserWithEmailAndPassword: paths.servicesUserPassword,
            cleanupExpiredPasswordResetTokens: paths.servicesPasswordReset,
            completePasswordReset: paths.servicesPasswordReset,
            createUserWithEmailAndPassword: paths.servicesUserPassword,
            PASSWORD_MAX_LENGTH: paths.constantsPassword,
            PASSWORD_MIN_LENGTH: paths.constantsPassword,
            PASSWORD_RESET_TOKEN_EXPIRY_SEC: paths.constantsPassword,
            registerUserWithEmailAndPassword: paths.servicesUserPassword,
            requestPasswordReset: paths.servicesPasswordReset,
            validatePasswordResetToken: paths.servicesPasswordReset,
          },
        ),
      },
    };
  },
});

export const LOCAL_AUTH_CORE_AUTH_EMAIL_PASSWORD_IMPORTS = {
  task: localAuthCoreAuthEmailPasswordImportsTask,
};
