import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { AUTH_PLACEHOLDER_AUTH_HOOKS_PATHS } from './template-paths.js';

const placeholderAuthHooksImportsSchema = createTsImportMapSchema({
  useCurrentUser: {},
  useLogOut: {},
  useRequiredUserId: {},
  useSession: {},
});

export type PlaceholderAuthHooksImportsProvider = TsImportMapProviderFromSchema<
  typeof placeholderAuthHooksImportsSchema
>;

export const placeholderAuthHooksImportsProvider =
  createReadOnlyProviderType<PlaceholderAuthHooksImportsProvider>(
    'placeholder-auth-hooks-imports',
  );

const authPlaceholderAuthHooksImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_PLACEHOLDER_AUTH_HOOKS_PATHS.provider,
  },
  exports: {
    placeholderAuthHooksImports:
      placeholderAuthHooksImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        placeholderAuthHooksImports: createTsImportMap(
          placeholderAuthHooksImportsSchema,
          {
            useCurrentUser: paths.useCurrentUser,
            useLogOut: paths.useLogOut,
            useRequiredUserId: paths.useRequiredUserId,
            useSession: paths.useSession,
          },
        ),
      },
    };
  },
});

export const AUTH_PLACEHOLDER_AUTH_HOOKS_IMPORTS = {
  task: authPlaceholderAuthHooksImportsTask,
};
