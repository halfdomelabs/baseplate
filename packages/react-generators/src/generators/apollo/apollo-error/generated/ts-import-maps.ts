import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const apolloErrorImportsSchema = createTsImportMapSchema({
  getApolloErrorCode: {},
});

type ApolloErrorImportsProvider = TsImportMapProviderFromSchema<
  typeof apolloErrorImportsSchema
>;

export const apolloErrorImportsProvider =
  createReadOnlyProviderType<ApolloErrorImportsProvider>(
    'apollo-error-imports',
  );

export function createApolloErrorImports(
  importBase: string,
): ApolloErrorImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(apolloErrorImportsSchema, {
    getApolloErrorCode: path.join(importBase, 'apollo-error.js'),
  });
}
