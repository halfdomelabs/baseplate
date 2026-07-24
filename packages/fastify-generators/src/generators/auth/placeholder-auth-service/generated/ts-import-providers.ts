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

import { AUTH_PLACEHOLDER_AUTH_SERVICE_PATHS } from './template-paths.js';

export const placeholderAuthServiceImportsSchema = createTsImportMapSchema({
  userSessionService: {},
});

export type PlaceholderAuthServiceImportsProvider =
  TsImportMapProviderFromSchema<typeof placeholderAuthServiceImportsSchema>;

export const placeholderAuthServiceImportsProvider =
  createReadOnlyProviderType<PlaceholderAuthServiceImportsProvider>(
    'placeholder-auth-service-imports',
  );

const authPlaceholderAuthServiceImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_PLACEHOLDER_AUTH_SERVICE_PATHS.provider,
  },
  exports: {
    placeholderAuthServiceImports:
      placeholderAuthServiceImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        placeholderAuthServiceImports: createTsImportMap(
          placeholderAuthServiceImportsSchema,
          { userSessionService: paths.userSessionService },
        ),
      },
    };
  },
});

export const AUTH_PLACEHOLDER_AUTH_SERVICE_IMPORTS = {
  task: authPlaceholderAuthServiceImportsTask,
};
