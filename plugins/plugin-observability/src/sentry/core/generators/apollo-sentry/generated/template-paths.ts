import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface ApolloApolloSentryPaths {
  apolloSentryLink: string;
}

const apolloApolloSentryPaths = createProviderType<ApolloApolloSentryPaths>(
  'apollo-apollo-sentry-paths',
);

const apolloApolloSentryPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { apolloApolloSentryPaths: apolloApolloSentryPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        apolloApolloSentryPaths: {
          apolloSentryLink: `${srcRoot}/services/apollo/apollo-sentry-link.ts`,
        },
      },
    };
  },
});

export const APOLLO_APOLLO_SENTRY_PATHS = {
  provider: apolloApolloSentryPaths,
  task: apolloApolloSentryPathsTask,
};
