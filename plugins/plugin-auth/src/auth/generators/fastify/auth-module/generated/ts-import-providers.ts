import {
  createTsImportMap,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  userSessionServiceImportsProvider,
  userSessionServiceImportsSchema,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask } from '@baseplate-dev/sync';

import { FASTIFY_AUTH_MODULE_PATHS } from './template-paths.js';

const fastifyAuthModuleImportsTask = createGeneratorTask({
  dependencies: {
    paths: FASTIFY_AUTH_MODULE_PATHS.provider,
  },
  exports: {
    userSessionServiceImports:
      userSessionServiceImportsProvider.export(projectScope),
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

export const FASTIFY_AUTH_MODULE_IMPORTS = {
  task: fastifyAuthModuleImportsTask,
};
