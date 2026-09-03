import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PlaceholderAuthCorePlaceholderAuthHooksPaths {
  useLogOut: string;
  useSession: string;
  useUserIdOrThrow: string;
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
          useLogOut: `${srcRoot}/hooks/use-log-out.ts`,
          useSession: `${srcRoot}/hooks/use-session.ts`,
          useUserIdOrThrow: `${srcRoot}/hooks/use-user-id-or-throw.ts`,
        },
      },
    };
  },
});

export const PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_HOOKS_PATHS = {
  provider: placeholderAuthCorePlaceholderAuthHooksPaths,
  task: placeholderAuthCorePlaceholderAuthHooksPathsTask,
};
