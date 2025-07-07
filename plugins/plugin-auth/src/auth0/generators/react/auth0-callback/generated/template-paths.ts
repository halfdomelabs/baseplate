import { reactRoutesProvider } from '@baseplate-dev/react-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface Auth0Auth0CallbackPaths {
  auth0CallbackPage: string;
  signupPage: string;
}

const auth0Auth0CallbackPaths = createProviderType<Auth0Auth0CallbackPaths>(
  'auth0-auth0-callback-paths',
);

const auth0Auth0CallbackPathsTask = createGeneratorTask({
  dependencies: { reactRoutes: reactRoutesProvider },
  exports: { auth0Auth0CallbackPaths: auth0Auth0CallbackPaths.export() },
  run({ reactRoutes }) {
    const routesRoot = reactRoutes.getOutputRelativePath();

    return {
      providers: {
        auth0Auth0CallbackPaths: {
          auth0CallbackPage: `${routesRoot}/auth0-callback.tsx`,
          signupPage: `${routesRoot}/signup.tsx`,
        },
      },
    };
  },
});

export const AUTH0_AUTH0_CALLBACK_PATHS = {
  provider: auth0Auth0CallbackPaths,
  task: auth0Auth0CallbackPathsTask,
};
