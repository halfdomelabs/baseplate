import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface BetterAuthBetterAuthHooksPaths {
  useLogOut: string;
  useRequiredUserId: string;
  useSession: string;
}

const betterAuthBetterAuthHooksPaths =
  createProviderType<BetterAuthBetterAuthHooksPaths>(
    'better-auth-better-auth-hooks-paths',
  );

const betterAuthBetterAuthHooksPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    betterAuthBetterAuthHooksPaths: betterAuthBetterAuthHooksPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        betterAuthBetterAuthHooksPaths: {
          useLogOut: `${srcRoot}/hooks/use-log-out.ts`,
          useRequiredUserId: `${srcRoot}/hooks/use-required-user-id.ts`,
          useSession: `${srcRoot}/hooks/use-session.ts`,
        },
      },
    };
  },
});

export const BETTER_AUTH_BETTER_AUTH_HOOKS_PATHS = {
  provider: betterAuthBetterAuthHooksPaths,
  task: betterAuthBetterAuthHooksPathsTask,
};
