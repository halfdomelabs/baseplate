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
          '*': paths.gqlGraphql,
          FragmentType: paths.gqlFragmentMasking,
          graphql: paths.gqlGql,
          readFragment: paths.gqlFragmentMasking,
        }),
        reactApolloImports: createTsImportMap(reactApolloImportsSchema, {
          createApolloCache: paths.cache,
          createApolloClient: paths.service,
        }),
      },
    };
  },
});

export const APOLLO_REACT_APOLLO_IMPORTS = {
  task: apolloReactApolloImportsTask,
};
