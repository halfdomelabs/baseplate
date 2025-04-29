import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

import type { TsImportMapProviderFromSchema } from '@src/renderers/typescript/index.js';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@src/renderers/typescript/index.js';

const tsUtilsImportsSchema = createTsImportMapSchema({
  capitalizeString: {},
  NormalizeTypes: { isTypeOnly: true },
  notEmpty: {},
  restrictObjectNulls: {},
});

type TsUtilsImportsProvider = TsImportMapProviderFromSchema<
  typeof tsUtilsImportsSchema
>;

export const tsUtilsImportsProvider =
  createReadOnlyProviderType<TsUtilsImportsProvider>('ts-utils-imports');

export function createTsUtilsImports(
  importBase: string,
): TsUtilsImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(tsUtilsImportsSchema, {
    capitalizeString: path.join(importBase, 'string.js'),
    NormalizeTypes: path.join(importBase, 'normalize-types.js'),
    notEmpty: path.join(importBase, 'arrays.js'),
    restrictObjectNulls: path.join(importBase, 'nulls.js'),
  });
}
