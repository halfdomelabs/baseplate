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

import { AUTH_PASSWORD_HASHER_SERVICE_PATHS } from './template-paths.js';

export const passwordHasherServiceImportsSchema = createTsImportMapSchema({
  createPasswordHash: {},
  verifyPasswordHash: {},
});

export type PasswordHasherServiceImportsProvider =
  TsImportMapProviderFromSchema<typeof passwordHasherServiceImportsSchema>;

export const passwordHasherServiceImportsProvider =
  createReadOnlyProviderType<PasswordHasherServiceImportsProvider>(
    'password-hasher-service-imports',
  );

const authPasswordHasherServiceImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_PASSWORD_HASHER_SERVICE_PATHS.provider,
  },
  exports: {
    passwordHasherServiceImports:
      passwordHasherServiceImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        passwordHasherServiceImports: createTsImportMap(
          passwordHasherServiceImportsSchema,
          {
            createPasswordHash: paths.passwordHasherService,
            verifyPasswordHash: paths.passwordHasherService,
          },
        ),
      },
    };
  },
});

export const AUTH_PASSWORD_HASHER_SERVICE_IMPORTS = {
  task: authPasswordHasherServiceImportsTask,
};
