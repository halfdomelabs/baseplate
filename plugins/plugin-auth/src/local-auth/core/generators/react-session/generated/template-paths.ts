import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface LocalAuthCoreReactSessionPaths {
  userSessionClient: string;
  userSessionProvider: string;
  userSessionProviderGql: string;
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
          userSessionClient: `${srcRoot}/services/user-session-client.ts`,
          userSessionProvider: `${srcRoot}/app/user-session-provider.tsx`,
          userSessionProviderGql: `${srcRoot}/app/user-session-provider.gql`,
        },
      },
    };
  },
});

export const LOCAL_AUTH_CORE_REACT_SESSION_PATHS = {
  provider: localAuthCoreReactSessionPaths,
  task: localAuthCoreReactSessionPathsTask,
};
