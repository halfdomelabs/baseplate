import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { FASTIFY_STORAGE_MODULE_PATHS } from './template-paths.js';

export const storageModuleImportsSchema = createTsImportMapSchema({
  createFileCategory: {},
  createPresignedDownloadUrl: {},
  CreatePresignedUploadOptions: { isTypeOnly: true },
  createPresignedUploadUrl: {},
  createS3Adapter: {},
  createUrlAdapter: {},
  downloadFile: {},
  FILE_CATEGORIES: {},
  FileCategory: { isTypeOnly: true },
  FileCategoryName: { isTypeOnly: true },
  fileField: {},
  FileInput: { isTypeOnly: true },
  fileInputInputType: {},
  FileMetadata: { isTypeOnly: true },
  FileSize: {},
  FileUploadInput: { isTypeOnly: true },
  FileUploadOptions: { isTypeOnly: true },
  getCategoryByName: {},
  getCategoryByNameOrThrow: {},
  getEncodingFromContentType: {},
  getMimeTypeFromContentType: {},
  InvalidMimeTypeError: {},
  MimeTypes: {},
  PresignedUploadUrl: { isTypeOnly: true },
  STORAGE_ADAPTERS: {},
  StorageAdapter: { isTypeOnly: true },
  StorageAdapterKey: { isTypeOnly: true },
  validateFileExtensionWithMimeType: {},
  validateFileInput: {},
  validateFileUploadOptions: {},
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
    storageModuleImports: storageModuleImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        storageModuleImports: createTsImportMap(storageModuleImportsSchema, {
          createFileCategory: paths.utilsCreateFileCategory,
          createPresignedDownloadUrl: paths.servicesCreatePresignedDownloadUrl,
          CreatePresignedUploadOptions: paths.typesAdapter,
          createPresignedUploadUrl: paths.servicesCreatePresignedUploadUrl,
          createS3Adapter: paths.adaptersS_3,
          createUrlAdapter: paths.adaptersUrl,
          downloadFile: paths.servicesDownloadFile,
          FILE_CATEGORIES: paths.configCategories,
          FileCategory: paths.typesFileCategory,
          FileCategoryName: paths.configCategories,
          fileField: paths.servicesFileField,
          FileInput: paths.servicesFileField,
          fileInputInputType: paths.schemaFileInput,
          FileMetadata: paths.typesAdapter,
          FileSize: paths.utilsCreateFileCategory,
          FileUploadInput: paths.servicesValidateFileInput,
          FileUploadOptions: paths.utilsValidateFileUploadOptions,
          getCategoryByName: paths.configCategories,
          getCategoryByNameOrThrow: paths.configCategories,
          getEncodingFromContentType: paths.utilsMime,
          getMimeTypeFromContentType: paths.utilsMime,
          InvalidMimeTypeError: paths.utilsMime,
          MimeTypes: paths.utilsCreateFileCategory,
          PresignedUploadUrl: paths.typesAdapter,
          STORAGE_ADAPTERS: paths.configAdapters,
          StorageAdapter: paths.typesAdapter,
          StorageAdapterKey: paths.configAdapters,
          validateFileExtensionWithMimeType: paths.utilsMime,
          validateFileInput: paths.servicesValidateFileInput,
          validateFileUploadOptions: paths.utilsValidateFileUploadOptions,
        }),
      },
    };
  },
});

export const FASTIFY_STORAGE_MODULE_IMPORTS = {
  task: fastifyStorageModuleImportsTask,
};
