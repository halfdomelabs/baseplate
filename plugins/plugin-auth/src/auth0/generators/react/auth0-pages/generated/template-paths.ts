import { reactRoutesProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface Auth0Auth0PagesPaths {
  login: string;
}

const auth0Auth0PagesPaths = createProviderType<Auth0Auth0PagesPaths>(
  'auth0-auth0-pages-paths',
);

const auth0Auth0PagesPathsTask = createGeneratorTask({
  dependencies: { reactRoutes: reactRoutesProvider },
  exports: { auth0Auth0PagesPaths: auth0Auth0PagesPaths.export() },
  run({ reactRoutes }) {
    const routesRoot = reactRoutes.getOutputRelativePath();

    return {
      providers: {
        auth0Auth0PagesPaths: { login: `${routesRoot}/login.tsx` },
      },
    };
  },
});

export const AUTH0_AUTH0_PAGES_PATHS = {
  provider: auth0Auth0PagesPaths,
  task: auth0Auth0PagesPathsTask,
};
