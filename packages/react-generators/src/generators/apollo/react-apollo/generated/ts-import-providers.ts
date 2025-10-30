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
  generatedGraphqlImportsProvider,
  generatedGraphqlImportsSchema,
} from '#src/generators/apollo/react-apollo/providers/generated-graphql.js';

import { APOLLO_REACT_APOLLO_PATHS } from './template-paths.js';

export const reactApolloImportsSchema = createTsImportMapSchema({
  config: {},
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
    generatedGraphqlImports:
      generatedGraphqlImportsProvider.export(packageScope),
    reactApolloImports: reactApolloImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        generatedGraphqlImports: createTsImportMap(
          generatedGraphqlImportsSchema,
          { '*': paths.graphql },
        ),
        reactApolloImports: createTsImportMap(reactApolloImportsSchema, {
          config: paths.codegenConfig,
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
