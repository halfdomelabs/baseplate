import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const reactApolloImportsSchema = createTsImportMapSchema({
  createApolloCache: {},
  createApolloClient: {},
});

type ReactApolloImportsProvider = TsImportMapProviderFromSchema<
  typeof reactApolloImportsSchema
>;

export const reactApolloImportsProvider =
  createReadOnlyProviderType<ReactApolloImportsProvider>(
    'react-apollo-imports',
  );

export function createReactApolloImports(
  importBase: string,
): ReactApolloImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(reactApolloImportsSchema, {
    createApolloCache: path.join(importBase, 'cache.js'),
    createApolloClient: path.join(importBase, 'index.js'),
  });
}

const generatedGraphqlImportsSchema = createTsImportMapSchema({ '*': {} });

type GeneratedGraphqlImportsProvider = TsImportMapProviderFromSchema<
  typeof generatedGraphqlImportsSchema
>;

export const generatedGraphqlImportsProvider =
  createReadOnlyProviderType<GeneratedGraphqlImportsProvider>(
    'generated-graphql-imports',
  );

export function createGeneratedGraphqlImports(
  importBase: string,
): GeneratedGraphqlImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(generatedGraphqlImportsSchema, {
    '*': path.join(importBase, 'graphql.js'),
  });
}
