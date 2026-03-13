import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface ApolloReactApolloPaths {
  appApolloProvider: string;
  cache: string;
  codegen: string;
  gqlFragmentMasking: string;
  gqlGql: string;
  gqlGraphql: string;
  graphqlConfig: string;
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
          codegen: `${packageRoot}/codegen.ts`,
          gqlFragmentMasking: `${srcRoot}/gql/fragment-masking.ts`,
          gqlGql: `${srcRoot}/gql/gql.ts`,
          gqlGraphql: `${srcRoot}/gql/graphql.ts`,
          graphqlConfig: `${packageRoot}/graphql.config.ts`,
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
