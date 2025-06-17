import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { FASTIFY_STORAGE_MODULE_PATHS } from './template-paths.js';

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

export type StorageModuleImportsProvider = TsImportMapProviderFromSchema<
  typeof storageModuleImportsSchema
>;

export const storageModuleImportsProvider =
  createReadOnlyProviderType<StorageModuleImportsProvider>(
    'storage-module-imports',
  );

const fastifyStorageModuleImportsTask = createGeneratorTask({
  dependencies: {
    paths: FASTIFY_STORAGE_MODULE_PATHS.provider,
  },
  exports: {
    storageModuleImports: storageModuleImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        storageModuleImports: createTsImportMap(storageModuleImportsSchema, {
          createPresignedDownloadUrl: paths.servicesCreatePresignedDownloadUrl,
          createPresignedUploadUrl: paths.servicesCreatePresignedUploadUrl,
          CreatePresignedUploadUrlPayload:
            paths.servicesCreatePresignedUploadUrl,
          downloadFile: paths.servicesDownloadFile,
          FileUploadInput: paths.servicesValidateUploadInput,
          getMimeTypeFromContentType: paths.utilsMime,
          prepareUploadData: paths.utilsUpload,
          UploadDataInput: paths.utilsUpload,
          uploadFile: paths.servicesUploadFile,
          validateFileExtensionWithMimeType: paths.utilsMime,
          validateFileUploadInput: paths.servicesValidateUploadInput,
        }),
      },
    };
  },
});

export const FASTIFY_STORAGE_MODULE_IMPORTS = {
  task: fastifyStorageModuleImportsTask,
};
