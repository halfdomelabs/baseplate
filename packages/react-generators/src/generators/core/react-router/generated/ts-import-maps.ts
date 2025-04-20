import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const reactRouterImportsSchema = createTsImportMapSchema({ PagesRoot: {} });

type ReactRouterImportsProvider = TsImportMapProviderFromSchema<
  typeof reactRouterImportsSchema
>;

export const reactRouterImportsProvider =
  createReadOnlyProviderType<ReactRouterImportsProvider>(
    'react-router-imports',
  );

export function createReactRouterImports(
  importBase: string,
): ReactRouterImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(reactRouterImportsSchema, {
    PagesRoot: path.join(importBase, 'index.js'),
  });
}
