import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import {
  graphqlImportsProvider,
  graphqlImportsSchema,
} from '#src/generators/apollo/react-apollo/providers/graphql-imports.js';

import { APOLLO_REACT_APOLLO_PATHS } from './template-paths.js';

export const reactApolloImportsSchema = createTsImportMapSchema({
  createApolloCache: {},
  createApolloClient: {},
  introspection: { isTypeOnly: true },
  introspection_types: { isTypeOnly: true },
});

export type ReactApolloImportsProvider = TsImportMapProviderFromSchema<
  typeof reactApolloImportsSchema
>;

export const reactApolloImportsProvider =
  createReadOnlyProviderType<ReactApolloImportsProvider>(
    'react-apollo-imports',
  );

const apolloReactApolloImportsTask = createGeneratorTask({
  dependencies: {
    paths: APOLLO_REACT_APOLLO_PATHS.provider,
  },
  exports: {
    graphqlImports: graphqlImportsProvider.export(packageScope),
    reactApolloImports: reactApolloImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        graphqlImports: createTsImportMap(graphqlImportsSchema, {
          FragmentOf: paths.graphql,
          graphql: paths.graphql,
          readFragment: paths.graphql,
          ResultOf: paths.graphql,
          VariablesOf: paths.graphql,
        }),
        reactApolloImports: createTsImportMap(reactApolloImportsSchema, {
          createApolloCache: paths.cache,
          createApolloClient: paths.service,
          introspection: paths.graphqlEnvD,
          introspection_types: paths.graphqlEnvD,
        }),
      },
    };
  },
});

export const APOLLO_REACT_APOLLO_IMPORTS = {
  task: apolloReactApolloImportsTask,
};
