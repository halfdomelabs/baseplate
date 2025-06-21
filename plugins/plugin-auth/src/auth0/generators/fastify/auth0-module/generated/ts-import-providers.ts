import {
  createTsImportMap,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  userSessionServiceImportsProvider,
  userSessionServiceImportsSchema,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask } from '@baseplate-dev/sync';

import { AUTH0_AUTH0_MODULE_PATHS } from './template-paths.js';

const auth0Auth0ModuleImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH0_AUTH0_MODULE_PATHS.provider,
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

export const AUTH0_AUTH0_MODULE_IMPORTS = {
  task: auth0Auth0ModuleImportsTask,
};
