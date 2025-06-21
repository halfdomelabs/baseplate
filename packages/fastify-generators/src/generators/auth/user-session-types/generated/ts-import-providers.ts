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

import { AUTH_USER_SESSION_TYPES_PATHS } from './template-paths.js';

const userSessionTypesImportsSchema = createTsImportMapSchema({
  UserSessionPayload: { isTypeOnly: true },
  UserSessionService: { isTypeOnly: true },
});

export type UserSessionTypesImportsProvider = TsImportMapProviderFromSchema<
  typeof userSessionTypesImportsSchema
>;

export const userSessionTypesImportsProvider =
  createReadOnlyProviderType<UserSessionTypesImportsProvider>(
    'user-session-types-imports',
  );

const authUserSessionTypesImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_USER_SESSION_TYPES_PATHS.provider,
  },
  exports: {
    userSessionTypesImports:
      userSessionTypesImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        userSessionTypesImports: createTsImportMap(
          userSessionTypesImportsSchema,
          {
            UserSessionPayload: paths.userSessionTypes,
            UserSessionService: paths.userSessionTypes,
          },
        ),
      },
    };
  },
});

export const AUTH_USER_SESSION_TYPES_IMPORTS = {
  task: authUserSessionTypesImportsTask,
};
