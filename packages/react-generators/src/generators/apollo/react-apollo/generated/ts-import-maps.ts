import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
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
