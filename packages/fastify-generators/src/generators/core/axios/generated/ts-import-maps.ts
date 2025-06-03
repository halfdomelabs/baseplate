import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const axiosImportsSchema = createTsImportMapSchema({ getAxiosErrorInfo: {} });

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
    getAxiosErrorInfo: path.join(importBase, 'axios.js'),
  });
}
