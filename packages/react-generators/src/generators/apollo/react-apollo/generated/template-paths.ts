import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface ApolloReactApolloPaths {
  appApolloProvider: string;
  cache: string;
  graphql: string;
  graphqlConfig: string;
  graphqlEnvD: string;
  service: string;
}

const apolloReactApolloPaths = createProviderType<ApolloReactApolloPaths>(
  'apollo-react-apollo-paths',
);

const apolloReactApolloPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { apolloReactApolloPaths: apolloReactApolloPaths.export() },
  run({ packageInfo }) {
    const packageRoot = packageInfo.getPackageRoot();
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        apolloReactApolloPaths: {
          appApolloProvider: `${srcRoot}/app/app-apollo-provider.tsx`,
          cache: `${srcRoot}/services/apollo/cache.ts`,
          graphql: `${srcRoot}/graphql.ts`,
          graphqlConfig: `${packageRoot}/graphql.config.ts`,
          graphqlEnvD: `${srcRoot}/graphql-env.d.ts`,
          service: `${srcRoot}/services/apollo/index.ts`,
        },
      },
    };
  },
});

export const APOLLO_REACT_APOLLO_PATHS = {
  provider: apolloReactApolloPaths,
  task: apolloReactApolloPathsTask,
};
