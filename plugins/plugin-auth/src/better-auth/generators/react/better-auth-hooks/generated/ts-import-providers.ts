import {
  createTsImportMap,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  authHooksImportsSchema,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask } from '@baseplate-dev/sync';

import { BETTER_AUTH_BETTER_AUTH_HOOKS_PATHS } from './template-paths.js';

const betterAuthBetterAuthHooksImportsTask = createGeneratorTask({
  dependencies: {
    paths: BETTER_AUTH_BETTER_AUTH_HOOKS_PATHS.provider,
  },
  exports: { authHooksImports: authHooksImportsProvider.export(packageScope) },
  run({ paths }) {
    return {
      providers: {
        authHooksImports: createTsImportMap(authHooksImportsSchema, {
          AuthRole: paths.useSession,
          SessionData: paths.useSession,
          useLogOut: paths.useLogOut,
          useRequiredUserId: paths.useRequiredUserId,
          useSession: paths.useSession,
        }),
      },
    };
  },
});

export const BETTER_AUTH_BETTER_AUTH_HOOKS_IMPORTS = {
  task: betterAuthBetterAuthHooksImportsTask,
};
