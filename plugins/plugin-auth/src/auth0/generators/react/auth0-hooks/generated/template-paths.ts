import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface Auth0Auth0HooksPaths {
  useCurrentUser: string;
  useCurrentUserGql: string;
  useLogOut: string;
  useRequiredUserId: string;
  useSession: string;
}

const auth0Auth0HooksPaths = createProviderType<Auth0Auth0HooksPaths>(
  'auth0-auth0-hooks-paths',
);

const auth0Auth0HooksPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { auth0Auth0HooksPaths: auth0Auth0HooksPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        auth0Auth0HooksPaths: {
          useCurrentUser: `${srcRoot}/hooks/use-current-user.ts`,
          useCurrentUserGql: `${srcRoot}/hooks/use-current-user.gql`,
          useLogOut: `${srcRoot}/hooks/use-log-out.ts`,
          useRequiredUserId: `${srcRoot}/hooks/use-required-user-id.ts`,
          useSession: `${srcRoot}/hooks/use-session.ts`,
        },
      },
    };
  },
});

export const AUTH0_AUTH0_HOOKS_PATHS = {
  provider: auth0Auth0HooksPaths,
  task: auth0Auth0HooksPathsTask,
};
