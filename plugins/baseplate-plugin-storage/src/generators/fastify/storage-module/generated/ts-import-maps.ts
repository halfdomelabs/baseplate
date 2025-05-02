import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const storageModuleImportsSchema = createTsImportMapSchema({
  createPresignedDownloadUrl: {},
  createPresignedUploadUrl: {},
  CreatePresignedUploadUrlPayload: { isTypeOnly: true },
  downloadFile: {},
  FileUploadInput: { isTypeOnly: true },
  getMimeTypeFromContentType: {},
  prepareUploadData: {},
  UploadDataInput: { isTypeOnly: true },
  uploadFile: {},
  validateFileExtensionWithMimeType: {},
  validateFileUploadInput: {},
});

type StorageModuleImportsProvider = TsImportMapProviderFromSchema<
  typeof storageModuleImportsSchema
>;

export const storageModuleImportsProvider =
  createReadOnlyProviderType<StorageModuleImportsProvider>(
    'storage-module-imports',
  );

export function createStorageModuleImports(
  importBase: string,
): StorageModuleImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(storageModuleImportsSchema, {
    createPresignedDownloadUrl: path.join(
      importBase,
      'services/create-presigned-download-url.js',
    ),
    createPresignedUploadUrl: path.join(
      importBase,
      'services/create-presigned-upload-url.js',
    ),
    CreatePresignedUploadUrlPayload: path.join(
      importBase,
      'services/create-presigned-upload-url.js',
    ),
    downloadFile: path.join(importBase, 'services/download-file.js'),
    FileUploadInput: path.join(importBase, 'services/validate-upload-input.js'),
    getMimeTypeFromContentType: path.join(importBase, 'utils/mime.js'),
    prepareUploadData: path.join(importBase, 'utils/upload.js'),
    UploadDataInput: path.join(importBase, 'utils/upload.js'),
    uploadFile: path.join(importBase, 'services/upload-file.js'),
    validateFileExtensionWithMimeType: path.join(importBase, 'utils/mime.js'),
    validateFileUploadInput: path.join(
      importBase,
      'services/validate-upload-input.js',
    ),
  });
}
