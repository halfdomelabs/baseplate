import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface BetterAuthReactBetterAuthPaths {
  authClient: string;
  authLoadedGate: string;
}

const betterAuthReactBetterAuthPaths =
  createProviderType<BetterAuthReactBetterAuthPaths>(
    'better-auth-react-better-auth-paths',
  );

const betterAuthReactBetterAuthPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    betterAuthReactBetterAuthPaths: betterAuthReactBetterAuthPaths.export(),
  },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        betterAuthReactBetterAuthPaths: {
          authClient: `${srcRoot}/services/auth-client.ts`,
          authLoadedGate: `${srcRoot}/app/auth-loaded-gate.tsx`,
        },
      },
    };
  },
});

export const BETTER_AUTH_REACT_BETTER_AUTH_PATHS = {
  provider: betterAuthReactBetterAuthPaths,
  task: betterAuthReactBetterAuthPathsTask,
};
