import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const uploadComponentsImportsSchema = createTsImportMapSchema({
  FileInput: { name: 'default' },
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
