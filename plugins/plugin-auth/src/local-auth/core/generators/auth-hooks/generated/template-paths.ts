import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface LocalAuthCoreAuthHooksPaths {
  useCurrentUser: string;
  useLogOut: string;
  useRequiredUserId: string;
  useSession: string;
}

const localAuthCoreAuthHooksPaths =
  createProviderType<LocalAuthCoreAuthHooksPaths>(
    'local-auth-core-auth-hooks-paths',
  );

const localAuthCoreAuthHooksPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    localAuthCoreAuthHooksPaths: localAuthCoreAuthHooksPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        localAuthCoreAuthHooksPaths: {
          useCurrentUser: `${srcRoot}/hooks/use-current-user.ts`,
          useLogOut: `${srcRoot}/hooks/use-log-out.ts`,
          useRequiredUserId: `${srcRoot}/hooks/use-user-id-or-throw.ts`,
          useSession: `${srcRoot}/hooks/use-session.ts`,
        },
      },
    };
  },
});

export const LOCAL_AUTH_CORE_AUTH_HOOKS_PATHS = {
  provider: localAuthCoreAuthHooksPaths,
  task: localAuthCoreAuthHooksPathsTask,
};
