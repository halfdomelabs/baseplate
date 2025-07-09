import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AuthCoreReactSessionPaths {
  userSessionCheckGql: string;
  userSessionCheck: string;
  userSessionProvider: string;
  useUserSessionClient: string;
  userSessionClient: string;
}

const authCoreReactSessionPaths = createProviderType<AuthCoreReactSessionPaths>(
  'auth-core-react-session-paths',
);

const authCoreReactSessionPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { authCoreReactSessionPaths: authCoreReactSessionPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        authCoreReactSessionPaths: {
          userSessionCheck: `${srcRoot}/app/user-session-check.tsx`,
          userSessionCheckGql: `${srcRoot}/app/user-session-check.gql`,
          userSessionClient: `${srcRoot}/services/user-session-client.ts`,
          userSessionProvider: `${srcRoot}/app/user-session-provider.tsx`,
          useUserSessionClient: `${srcRoot}/hooks/use-user-session-client.ts`,
        },
      },
    };
  },
});

export const AUTH_CORE_REACT_SESSION_PATHS = {
  provider: authCoreReactSessionPaths,
  task: authCoreReactSessionPathsTask,
};
