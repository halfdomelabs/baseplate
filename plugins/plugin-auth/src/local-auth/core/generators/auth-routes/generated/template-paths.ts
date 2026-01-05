import { reactRoutesProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AuthCoreAuthRoutesPaths {
  login: string;
  register: string;
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
          login: `${routesRoot}/auth_/login.tsx`,
          register: `${routesRoot}/auth_/register.tsx`,
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
