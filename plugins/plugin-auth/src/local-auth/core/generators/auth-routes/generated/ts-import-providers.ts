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

import { AUTH_CORE_AUTH_ROUTES_PATHS } from './template-paths.js';

export const authRoutesImportsSchema = createTsImportMapSchema({
  PASSWORD_MAX_LENGTH: {},
  PASSWORD_MIN_LENGTH: {},
});

export type AuthRoutesImportsProvider = TsImportMapProviderFromSchema<
  typeof authRoutesImportsSchema
>;

export const authRoutesImportsProvider =
  createReadOnlyProviderType<AuthRoutesImportsProvider>('auth-routes-imports');

const authCoreAuthRoutesImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_CORE_AUTH_ROUTES_PATHS.provider,
  },
  exports: {
    authRoutesImports: authRoutesImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        authRoutesImports: createTsImportMap(authRoutesImportsSchema, {
          PASSWORD_MAX_LENGTH: paths.constants,
          PASSWORD_MIN_LENGTH: paths.constants,
        }),
      },
    };
  },
});

export const AUTH_CORE_AUTH_ROUTES_IMPORTS = {
  task: authCoreAuthRoutesImportsTask,
};
