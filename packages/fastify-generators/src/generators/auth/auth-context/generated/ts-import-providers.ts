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

import { AUTH_AUTH_CONTEXT_PATHS } from './template-paths.js';

const authContextImportsSchema = createTsImportMapSchema({
  AuthContext: { isTypeOnly: true },
  AuthSessionInfo: { isTypeOnly: true },
  AuthUserSessionInfo: { isTypeOnly: true },
  createAuthContextFromSessionInfo: {},
  InvalidSessionError: {},
});

export type AuthContextImportsProvider = TsImportMapProviderFromSchema<
  typeof authContextImportsSchema
>;

export const authContextImportsProvider =
  createReadOnlyProviderType<AuthContextImportsProvider>(
    'auth-context-imports',
  );

const authAuthContextImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_AUTH_CONTEXT_PATHS.provider,
  },
  exports: {
    authContextImports: authContextImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        authContextImports: createTsImportMap(authContextImportsSchema, {
          AuthContext: paths.authContextTypes,
          AuthSessionInfo: paths.authSessionTypes,
          AuthUserSessionInfo: paths.authSessionTypes,
          createAuthContextFromSessionInfo: paths.authContextUtils,
          InvalidSessionError: paths.authSessionTypes,
        }),
      },
    };
  },
});

export const AUTH_AUTH_CONTEXT_IMPORTS = {
  task: authAuthContextImportsTask,
};
