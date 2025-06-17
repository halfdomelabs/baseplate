import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface ApolloApolloErrorPaths {
  apolloError: string;
}

const apolloApolloErrorPaths = createProviderType<ApolloApolloErrorPaths>(
  'apollo-apollo-error-paths',
);

const apolloApolloErrorPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { apolloApolloErrorPaths: apolloApolloErrorPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        apolloApolloErrorPaths: {
          apolloError: `${srcRoot}/utils/apollo-error.ts`,
        },
      },
    };
  },
});

export const APOLLO_APOLLO_ERROR_PATHS = {
  provider: apolloApolloErrorPaths,
  task: apolloApolloErrorPathsTask,
};
