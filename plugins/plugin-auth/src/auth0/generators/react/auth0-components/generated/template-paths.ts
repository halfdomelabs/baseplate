import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface Auth0Auth0ComponentsPaths {
  requireAuth: string;
}

const auth0Auth0ComponentsPaths = createProviderType<Auth0Auth0ComponentsPaths>(
  'auth0-auth0-components-paths',
);

const auth0Auth0ComponentsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { auth0Auth0ComponentsPaths: auth0Auth0ComponentsPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        auth0Auth0ComponentsPaths: {
          requireAuth: `${srcRoot}/components/RequireAuth/index.tsx`,
        },
      },
    };
  },
});

export const AUTH0_AUTH0_COMPONENTS_PATHS = {
  provider: auth0Auth0ComponentsPaths,
  task: auth0Auth0ComponentsPathsTask,
};
