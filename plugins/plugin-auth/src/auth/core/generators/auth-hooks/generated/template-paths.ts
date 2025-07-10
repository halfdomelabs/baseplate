import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AuthCoreAuthHooksPaths {
  useCurrentUser: string;
  useCurrentUserGql: string;
  useLogOut: string;
  useRequiredUserId: string;
  useSession: string;
}

const authCoreAuthHooksPaths = createProviderType<AuthCoreAuthHooksPaths>(
  'auth-core-auth-hooks-paths',
);

const authCoreAuthHooksPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { authCoreAuthHooksPaths: authCoreAuthHooksPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        authCoreAuthHooksPaths: {
          useCurrentUser: `${srcRoot}/hooks/use-current-user.ts`,
          useCurrentUserGql: `${srcRoot}/hooks/use-current-user.gql`,
          useLogOut: `${srcRoot}/hooks/use-log-out.ts`,
          useRequiredUserId: `${srcRoot}/hooks/use-user-id-or-throw.ts`,
          useSession: `${srcRoot}/hooks/use-session.ts`,
        },
      },
    };
  },
});

export const AUTH_CORE_AUTH_HOOKS_PATHS = {
  provider: authCoreAuthHooksPaths,
  task: authCoreAuthHooksPathsTask,
};
