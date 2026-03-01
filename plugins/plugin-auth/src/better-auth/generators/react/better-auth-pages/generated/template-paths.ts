import { reactRoutesProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface BetterAuthBetterAuthPagesPaths {
  login: string;
  register: string;
}

const betterAuthBetterAuthPagesPaths =
  createProviderType<BetterAuthBetterAuthPagesPaths>(
    'better-auth-better-auth-pages-paths',
  );

const betterAuthBetterAuthPagesPathsTask = createGeneratorTask({
  dependencies: { reactRoutes: reactRoutesProvider },
  exports: {
    betterAuthBetterAuthPagesPaths: betterAuthBetterAuthPagesPaths.export(),
  },
  run({ reactRoutes }) {
    const routesRoot = reactRoutes.getOutputRelativePath();

    return {
      providers: {
        betterAuthBetterAuthPagesPaths: {
          login: `${routesRoot}/login.tsx`,
          register: `${routesRoot}/register.tsx`,
        },
      },
    };
  },
});

export const BETTER_AUTH_BETTER_AUTH_PAGES_PATHS = {
  provider: betterAuthBetterAuthPagesPaths,
  task: betterAuthBetterAuthPagesPathsTask,
};
