import {
  createTsImportMap,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  userSessionServiceImportsProvider,
  userSessionServiceImportsSchema,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask } from '@baseplate-dev/sync';

import { AUTH_CORE_AUTH_MODULE_PATHS } from './template-paths.js';

const authCoreAuthModuleImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH_CORE_AUTH_MODULE_PATHS.provider,
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

export const AUTH_CORE_AUTH_MODULE_IMPORTS = {
  task: authCoreAuthModuleImportsTask,
};
