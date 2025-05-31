import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const reactUtilsImportsSchema = createTsImportMapSchema({
  getSafeLocalStorage: {},
});

type ReactUtilsImportsProvider = TsImportMapProviderFromSchema<
  typeof reactUtilsImportsSchema
>;

export const reactUtilsImportsProvider =
  createReadOnlyProviderType<ReactUtilsImportsProvider>('react-utils-imports');

export function createReactUtilsImports(
  importBase: string,
): ReactUtilsImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(reactUtilsImportsSchema, {
    getSafeLocalStorage: path.join(importBase, 'safe-local-storage.js'),
  });
}
