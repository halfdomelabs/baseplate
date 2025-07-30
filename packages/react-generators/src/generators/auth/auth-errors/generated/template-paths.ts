import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface AuthAuthErrorsPaths {
  authErrors: string;
}

const authAuthErrorsPaths = createProviderType<AuthAuthErrorsPaths>(
  'auth-auth-errors-paths',
);

const authAuthErrorsPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { authAuthErrorsPaths: authAuthErrorsPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        authAuthErrorsPaths: { authErrors: `${srcRoot}/utils/auth-errors.ts` },
      },
    };
  },
});

export const AUTH_AUTH_ERRORS_PATHS = {
  provider: authAuthErrorsPaths,
  task: authAuthErrorsPathsTask,
};
