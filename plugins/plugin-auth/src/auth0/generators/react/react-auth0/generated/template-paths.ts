import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface Auth0ReactAuth0Paths {
  authLoadedGate: string;
}

const auth0ReactAuth0Paths = createProviderType<Auth0ReactAuth0Paths>(
  'auth0-react-auth0-paths',
);

const auth0ReactAuth0PathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { auth0ReactAuth0Paths: auth0ReactAuth0Paths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        auth0ReactAuth0Paths: {
          authLoadedGate: `${srcRoot}/app/auth-loaded-gate.tsx`,
        },
      },
    };
  },
});

export const AUTH0_REACT_AUTH0_PATHS = {
  provider: auth0ReactAuth0Paths,
  task: auth0ReactAuth0PathsTask,
};
