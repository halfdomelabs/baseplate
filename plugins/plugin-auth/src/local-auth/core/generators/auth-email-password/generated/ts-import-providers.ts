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

import { AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS } from './template-paths.js';

const authEmailPasswordImportsSchema = createTsImportMapSchema({
  authenticateUserWithEmailAndPassword: {},
  createUserWithEmailAndPassword: {},
  PASSWORD_MIN_LENGTH: {},
});

export type AuthEmailPasswordImportsProvider = TsImportMapProviderFromSchema<
  typeof authEmailPasswordImportsSchema
>;

export const authEmailPasswordImportsProvider =
  createReadOnlyProviderType<AuthEmailPasswordImportsProvider>(
    'auth-email-password-imports',
  );

const authCoreAuthEmailPasswordImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_CORE_AUTH_EMAIL_PASSWORD_PATHS.provider,
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
            createUserWithEmailAndPassword: paths.servicesUserPassword,
            PASSWORD_MIN_LENGTH: paths.constantsPassword,
          },
        ),
      },
    };
  },
});

export const AUTH_CORE_AUTH_EMAIL_PASSWORD_IMPORTS = {
  task: authCoreAuthEmailPasswordImportsTask,
};
