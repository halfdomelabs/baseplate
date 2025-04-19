import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const reactAppImportsSchema = createTsImportMapSchema({ App: {} });

type ReactAppImportsProvider = TsImportMapProviderFromSchema<
  typeof reactAppImportsSchema
>;

export const reactAppImportsProvider =
  createReadOnlyProviderType<ReactAppImportsProvider>('react-app-imports');

export function createReactAppImports(
  importBase: string,
): ReactAppImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(reactAppImportsSchema, {
    App: path.join(importBase, 'App.js'),
  });
}
