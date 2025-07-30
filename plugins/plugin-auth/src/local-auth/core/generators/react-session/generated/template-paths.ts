import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface LocalAuthCoreReactSessionPaths {
  userSessionCheck: string;
  userSessionCheckGql: string;
  userSessionClient: string;
  userSessionProvider: string;
  useUserSessionClient: string;
}

const localAuthCoreReactSessionPaths =
  createProviderType<LocalAuthCoreReactSessionPaths>(
    'local-auth-core-react-session-paths',
  );

const localAuthCoreReactSessionPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    localAuthCoreReactSessionPaths: localAuthCoreReactSessionPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        localAuthCoreReactSessionPaths: {
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

export const LOCAL_AUTH_CORE_REACT_SESSION_PATHS = {
  provider: localAuthCoreReactSessionPaths,
  task: localAuthCoreReactSessionPathsTask,
};
