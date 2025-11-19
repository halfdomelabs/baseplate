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

import { AUTH_AUTH_ERRORS_PATHS } from './template-paths.js';

export const authErrorsImportsSchema = createTsImportMapSchema({
  InvalidRoleError: {},
});

export type AuthErrorsImportsProvider = TsImportMapProviderFromSchema<
  typeof authErrorsImportsSchema
>;

export const authErrorsImportsProvider =
  createReadOnlyProviderType<AuthErrorsImportsProvider>('auth-errors-imports');

const authAuthErrorsImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_AUTH_ERRORS_PATHS.provider,
  },
  exports: {
    authErrorsImports: authErrorsImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        authErrorsImports: createTsImportMap(authErrorsImportsSchema, {
          InvalidRoleError: paths.authErrors,
        }),
      },
    };
  },
});

export const AUTH_AUTH_ERRORS_IMPORTS = {
  task: authAuthErrorsImportsTask,
};
