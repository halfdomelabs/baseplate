import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AuthPlaceholderAuthHooksPaths {
  useCurrentUser: string;
  useLogOut: string;
  useRequiredUserId: string;
  useSession: string;
}

const authPlaceholderAuthHooksPaths =
  createProviderType<AuthPlaceholderAuthHooksPaths>(
    'auth-placeholder-auth-hooks-paths',
  );

const authPlaceholderAuthHooksPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    authPlaceholderAuthHooksPaths: authPlaceholderAuthHooksPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        authPlaceholderAuthHooksPaths: {
          useCurrentUser: `${srcRoot}/hooks/useCurrentUser.ts`,
          useLogOut: `${srcRoot}/hooks/useLogOut.ts`,
          useRequiredUserId: `${srcRoot}/hooks/useRequiredUserId.ts`,
          useSession: `${srcRoot}/hooks/useSession.ts`,
        },
      },
    };
  },
});

export const AUTH_PLACEHOLDER_AUTH_HOOKS_PATHS = {
  provider: authPlaceholderAuthHooksPaths,
  task: authPlaceholderAuthHooksPathsTask,
};
