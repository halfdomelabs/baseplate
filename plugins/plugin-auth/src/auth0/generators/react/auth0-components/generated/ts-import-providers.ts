import {
  createTsImportMap,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  authComponentsImportsProvider,
  authComponentsImportsSchema,
} from '@baseplate-dev/react-generators';
import { createGeneratorTask } from '@baseplate-dev/sync';

import { AUTH0_AUTH0_COMPONENTS_PATHS } from './template-paths.js';

const auth0Auth0ComponentsImportsTask = createGeneratorTask({
  dependencies: {
    paths: AUTH0_AUTH0_COMPONENTS_PATHS.provider,
  },
  exports: {
    authComponentsImports: authComponentsImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        authComponentsImports: createTsImportMap(authComponentsImportsSchema, {
          RequireAuth: paths.requireAuth,
        }),
      },
    };
  },
});

export const AUTH0_AUTH0_COMPONENTS_IMPORTS = {
  task: auth0Auth0ComponentsImportsTask,
};
