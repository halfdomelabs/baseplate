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

const reactSessionImportsSchema = createTsImportMapSchema({
  createUserSessionClient: {},
  SessionChangeCallback: { isTypeOnly: true },
  UserSessionClient: {},
  UserSessionClientConfig: { isTypeOnly: true },
  UserSessionClientContext: {},
  UserSessionClientContextValue: { isTypeOnly: true },
  UserSessionData: { isTypeOnly: true },
  useUserSessionClient: {},
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
          createUserSessionClient: paths.userSessionClient,
          SessionChangeCallback: paths.userSessionClient,
          UserSessionClient: paths.userSessionClient,
          UserSessionClientConfig: paths.userSessionClient,
          UserSessionClientContext: paths.useUserSessionClient,
          UserSessionClientContextValue: paths.useUserSessionClient,
          UserSessionData: paths.userSessionClient,
          useUserSessionClient: paths.useUserSessionClient,
        }),
      },
    };
  },
});

export const LOCAL_AUTH_CORE_REACT_SESSION_IMPORTS = {
  task: localAuthCoreReactSessionImportsTask,
};
