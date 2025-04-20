import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const reactErrorImportsSchema = createTsImportMapSchema({
  formatError: {},
  logAndFormatError: {},
  logError: {},
});

type ReactErrorImportsProvider = TsImportMapProviderFromSchema<
  typeof reactErrorImportsSchema
>;

export const reactErrorImportsProvider =
  createReadOnlyProviderType<ReactErrorImportsProvider>('react-error-imports');

export function createReactErrorImports(
  importBase: string,
): ReactErrorImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(reactErrorImportsSchema, {
    formatError: path.join(importBase, 'error-formatter.js'),
    logAndFormatError: path.join(importBase, 'error-formatter.js'),
    logError: path.join(importBase, 'error-logger.js'),
  });
}
