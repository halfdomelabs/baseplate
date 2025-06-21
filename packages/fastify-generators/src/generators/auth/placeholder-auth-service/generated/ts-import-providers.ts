import {
  createTsImportMap,
  packageScope,
} from '@baseplate-dev/core-generators';
import { createGeneratorTask } from '@baseplate-dev/sync';

import {
  userSessionServiceImportsProvider,
  userSessionServiceImportsSchema,
} from '#src/generators/auth/_providers/user-session.js';

import { AUTH_PLACEHOLDER_AUTH_SERVICE_PATHS } from './template-paths.js';

const authPlaceholderAuthServiceImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_PLACEHOLDER_AUTH_SERVICE_PATHS.provider,
  },
  exports: {
    userSessionServiceImports:
      userSessionServiceImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        userSessionServiceImports: createTsImportMap(
          userSessionServiceImportsSchema,
          { userSessionService: paths.userSessionService },
        ),
      },
    };
  },
});

export const AUTH_PLACEHOLDER_AUTH_SERVICE_IMPORTS = {
  task: authPlaceholderAuthServiceImportsTask,
};
