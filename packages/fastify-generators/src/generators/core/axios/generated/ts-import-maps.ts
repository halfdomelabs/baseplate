import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const axiosImportsSchema = createTsImportMapSchema({
  axiosClient: {},
  getAxiosErrorInfo: {},
  setupAxiosBetterStackTrace: {},
});

type AxiosImportsProvider = TsImportMapProviderFromSchema<
  typeof axiosImportsSchema
>;

export const axiosImportsProvider =
  createReadOnlyProviderType<AxiosImportsProvider>('axios-imports');

export function createAxiosImports(importBase: string): AxiosImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(axiosImportsSchema, {
    axiosClient: path.join(importBase, 'axios.js'),
    getAxiosErrorInfo: path.join(importBase, 'axios.js'),
    setupAxiosBetterStackTrace: path.join(importBase, 'axios.js'),
  });
}
