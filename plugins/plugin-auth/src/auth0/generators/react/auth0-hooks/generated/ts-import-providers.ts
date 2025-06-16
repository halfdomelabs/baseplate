import {
  createTsImportMap,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  authHooksImportsProvider,
  authHooksImportsSchema,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask } from '@baseplate-dev/sync';

import { AUTH0_AUTH0_HOOKS_PATHS } from './template-paths.js';

const auth0Auth0HooksImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH0_AUTH0_HOOKS_PATHS.provider,
  },
  exports: { authHooksImports: authHooksImportsProvider.export(projectScope) },
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

export const AUTH0_AUTH0_HOOKS_IMPORTS = {
  task: auth0Auth0HooksImportsTask,
};
