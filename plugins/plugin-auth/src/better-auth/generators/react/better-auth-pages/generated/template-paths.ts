import { reactRoutesProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface BetterAuthBetterAuthPagesPaths {
  forgotPassword: string;
  login: string;
  register: string;
  resetPassword: string;
  verifyEmail: string;
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
          forgotPassword: `${routesRoot}/forgot-password.tsx`,
          login: `${routesRoot}/login.tsx`,
          register: `${routesRoot}/register.tsx`,
          resetPassword: `${routesRoot}/reset-password.tsx`,
          verifyEmail: `${routesRoot}/verify-email.tsx`,
        },
      },
    };
  },
});

export const BETTER_AUTH_BETTER_AUTH_PAGES_PATHS = {
  provider: betterAuthBetterAuthPagesPaths,
  task: betterAuthBetterAuthPagesPathsTask,
};
