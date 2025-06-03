import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const pothosImportsSchema = createTsImportMapSchema({ builder: {} });

type PothosImportsProvider = TsImportMapProviderFromSchema<
  typeof pothosImportsSchema
>;

export const pothosImportsProvider =
  createReadOnlyProviderType<PothosImportsProvider>('pothos-imports');

export function createPothosImports(importBase: string): PothosImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(pothosImportsSchema, {
    builder: path.join(importBase, 'builder.js'),
  });
}
