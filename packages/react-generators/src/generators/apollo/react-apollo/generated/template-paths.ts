import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface ApolloReactApolloPaths {
  codegenYml: string;
  appApolloProvider: string;
  graphql: string;
  cache: string;
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
          codegenYml: `${packageRoot}/codegen.yml`,
          graphql: `${srcRoot}/generated/graphql.tsx`,
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
