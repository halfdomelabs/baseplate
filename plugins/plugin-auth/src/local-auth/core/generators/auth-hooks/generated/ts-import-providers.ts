import {
  createTsImportMap,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  authHooksImportsSchema,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask } from '@baseplate-dev/sync';

import { LOCAL_AUTH_CORE_AUTH_HOOKS_PATHS } from './template-paths.js';

const localAuthCoreAuthHooksImportsTask = createGeneratorTask({
  dependencies: {
    paths: LOCAL_AUTH_CORE_AUTH_HOOKS_PATHS.provider,
  },
  exports: { authHooksImports: authHooksImportsProvider.export(packageScope) },
  run({ paths }) {
    return {
      providers: {
        authHooksImports: createTsImportMap(authHooksImportsSchema, {
          AuthRole: paths.useSession,
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

export const LOCAL_AUTH_CORE_AUTH_HOOKS_IMPORTS = {
  task: localAuthCoreAuthHooksImportsTask,
};
