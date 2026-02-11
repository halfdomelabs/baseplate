import { reactRoutesProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AuthCoreAuthRoutesPaths {
  constants: string;
  forgotPassword: string;
  login: string;
  register: string;
  resetPassword: string;
  route: string;
}

const authCoreAuthRoutesPaths = createProviderType<AuthCoreAuthRoutesPaths>(
  'auth-core-auth-routes-paths',
);

const authCoreAuthRoutesPathsTask = createGeneratorTask({
  dependencies: { reactRoutes: reactRoutesProvider },
  exports: { authCoreAuthRoutesPaths: authCoreAuthRoutesPaths.export() },
  run({ reactRoutes }) {
    const routesRoot = reactRoutes.getOutputRelativePath();

    return {
      providers: {
        authCoreAuthRoutesPaths: {
          constants: `${routesRoot}/auth_/-constants.ts`,
          forgotPassword: `${routesRoot}/auth_/forgot-password.tsx`,
          login: `${routesRoot}/auth_/login.tsx`,
          register: `${routesRoot}/auth_/register.tsx`,
          resetPassword: `${routesRoot}/auth_/reset-password.tsx`,
          route: `${routesRoot}/auth_/route.tsx`,
        },
      },
    };
  },
});

export const AUTH_CORE_AUTH_ROUTES_PATHS = {
  provider: authCoreAuthRoutesPaths,
  task: authCoreAuthRoutesPathsTask,
};
