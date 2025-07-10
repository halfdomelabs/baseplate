import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PlaceholderAuthCorePlaceholderAuthHooksPaths {
  useCurrentUser: string;
  useCurrentUserGql: string;
  useLogOut: string;
  useRequiredUserId: string;
  useSession: string;
}

const placeholderAuthCorePlaceholderAuthHooksPaths =
  createProviderType<PlaceholderAuthCorePlaceholderAuthHooksPaths>(
    'placeholder-auth-core-placeholder-auth-hooks-paths',
  );

const placeholderAuthCorePlaceholderAuthHooksPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    placeholderAuthCorePlaceholderAuthHooksPaths:
      placeholderAuthCorePlaceholderAuthHooksPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        placeholderAuthCorePlaceholderAuthHooksPaths: {
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

export const PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_HOOKS_PATHS = {
  provider: placeholderAuthCorePlaceholderAuthHooksPaths,
  task: placeholderAuthCorePlaceholderAuthHooksPathsTask,
};
