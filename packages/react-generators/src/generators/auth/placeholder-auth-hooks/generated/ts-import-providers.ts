import {
  createTsImportMap,
  packageScope,
} from '@baseplate-dev/core-generators';
import { createGeneratorTask } from '@baseplate-dev/sync';

import {
  authHooksImportsProvider,
  authHooksImportsSchema,
} from '#src/generators/auth/_providers/auth-hooks.js';

import { AUTH_PLACEHOLDER_AUTH_HOOKS_PATHS } from './template-paths.js';

const authPlaceholderAuthHooksImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_PLACEHOLDER_AUTH_HOOKS_PATHS.provider,
  },
  exports: { authHooksImports: authHooksImportsProvider.export(packageScope) },
  run({ paths }) {
    return {
      providers: {
        authHooksImports: createTsImportMap(authHooksImportsSchema, {
          SessionData: paths.useSession,
          useCurrentUser: paths.useCurrentUser,
          useLogOut: paths.useLogOut,
          useRequiredUserId: paths.useRequiredUserId,
          useSession: paths.useSession,
        }),
      },
    };
  },
});

export const AUTH_PLACEHOLDER_AUTH_HOOKS_IMPORTS = {
  task: authPlaceholderAuthHooksImportsTask,
};
