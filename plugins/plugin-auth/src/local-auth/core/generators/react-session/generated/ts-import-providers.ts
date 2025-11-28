import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { LOCAL_AUTH_CORE_REACT_SESSION_PATHS } from './template-paths.js';

export const reactSessionImportsSchema = createTsImportMapSchema({
  UserSessionClient: {},
  userSessionClient: {},
});

export type ReactSessionImportsProvider = TsImportMapProviderFromSchema<
  typeof reactSessionImportsSchema
>;

export const reactSessionImportsProvider =
  createReadOnlyProviderType<ReactSessionImportsProvider>(
    'react-session-imports',
  );

const localAuthCoreReactSessionImportsTask = createGeneratorTask({
  dependencies: {
    paths: LOCAL_AUTH_CORE_REACT_SESSION_PATHS.provider,
  },
  exports: {
    reactSessionImports: reactSessionImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        reactSessionImports: createTsImportMap(reactSessionImportsSchema, {
          UserSessionClient: paths.userSessionClient,
          userSessionClient: paths.userSessionClient,
        }),
      },
    };
  },
});

export const LOCAL_AUTH_CORE_REACT_SESSION_IMPORTS = {
  task: localAuthCoreReactSessionImportsTask,
};
