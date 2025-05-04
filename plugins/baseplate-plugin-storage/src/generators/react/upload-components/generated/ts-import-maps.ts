import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const uploadComponentsImportsSchema = createTsImportMapSchema({
  FileInput: {},
  useUpload: {},
});

type UploadComponentsImportsProvider = TsImportMapProviderFromSchema<
  typeof uploadComponentsImportsSchema
>;

export const uploadComponentsImportsProvider =
  createReadOnlyProviderType<UploadComponentsImportsProvider>(
    'upload-components-imports',
  );

export function createUploadComponentsImports(
  importBase: string,
): UploadComponentsImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(uploadComponentsImportsSchema, {
    FileInput: path.join(importBase, 'components/FileInput/index.js'),
    useUpload: path.join(importBase, 'hooks/useUpload.js'),
  });
}
