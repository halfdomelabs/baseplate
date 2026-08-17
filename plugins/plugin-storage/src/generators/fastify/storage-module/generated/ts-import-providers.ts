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
  cleanUnusedFiles: {},
  cleanUnusedFilesQueue: {},
  cleanUnusedFilesWorker: {},
  createFakeStorageAdapter: {},
  createFakeStorageService: {},
  createFileCategory: {},
  createPresignedDownloadUrl: {},
  CreatePresignedUploadOptions: { isTypeOnly: true },
  createPresignedUploadUrl: {},
  createS3Adapter: {},
  createStorageService: {},
  createUrlAdapter: {},
  downloadFile: {},
  FileCategory: { isTypeOnly: true },
  FileConnect: { isTypeOnly: true },
  FileDisconnect: { isTypeOnly: true },
  FileInput: { isTypeOnly: true },
  fileInputInputType: {},
  fileInputSchema: {},
  FileMetadata: { isTypeOnly: true },
  fileNullableInputSchema: {},
  FileSize: {},
  fileTransformer: {},
  FileUploadOptions: { isTypeOnly: true },
  getEncodingFromContentType: {},
  getMimeTypeFromContentType: {},
  InvalidMimeTypeError: {},
  MimeTypes: {},
  PresignedUploadUrl: { isTypeOnly: true },
  StorageAdapter: { isTypeOnly: true },
  StorageAdapterKey: { isTypeOnly: true },
  StorageService: { isTypeOnly: true },
  ValidatedPendingUpload: { isTypeOnly: true },
  validateFileExtensionWithMimeType: {},
  validateFileUploadOptions: {},
  validatePendingUpload: {},
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
          cleanUnusedFiles: paths.servicesCleanUnusedFiles,
          cleanUnusedFilesQueue: paths.queuesCleanUnusedFiles,
          cleanUnusedFilesWorker: paths.queuesCleanUnusedFilesWorker,
          createFakeStorageAdapter: paths.storageTestHelper,
          createFakeStorageService: paths.storageTestHelper,
          createFileCategory: paths.utilsCreateFileCategory,
          createPresignedDownloadUrl: paths.servicesCreatePresignedDownloadUrl,
          CreatePresignedUploadOptions: paths.typesAdapter,
          createPresignedUploadUrl: paths.servicesCreatePresignedUploadUrl,
          createS3Adapter: paths.adaptersS_3,
          createStorageService: paths.servicesStorage,
          createUrlAdapter: paths.adaptersUrl,
          downloadFile: paths.servicesDownloadFile,
          FileCategory: paths.typesFileCategory,
          FileConnect: paths.servicesFileTransformer,
          FileDisconnect: paths.servicesFileTransformer,
          FileInput: paths.servicesFileTransformer,
          fileInputInputType: paths.schemaFileInput,
          fileInputSchema: paths.servicesFileTransformer,
          FileMetadata: paths.typesAdapter,
          fileNullableInputSchema: paths.servicesFileTransformer,
          FileSize: paths.utilsCreateFileCategory,
          fileTransformer: paths.servicesFileTransformer,
          FileUploadOptions: paths.utilsValidateFileUploadOptions,
          getEncodingFromContentType: paths.utilsMime,
          getMimeTypeFromContentType: paths.utilsMime,
          InvalidMimeTypeError: paths.utilsMime,
          MimeTypes: paths.utilsCreateFileCategory,
          PresignedUploadUrl: paths.typesAdapter,
          StorageAdapter: paths.typesAdapter,
          StorageAdapterKey: paths.servicesStorage,
          StorageService: paths.servicesStorage,
          ValidatedPendingUpload: paths.utilsValidatePendingUpload,
          validateFileExtensionWithMimeType: paths.utilsMime,
          validateFileUploadOptions: paths.utilsValidateFileUploadOptions,
          validatePendingUpload: paths.utilsValidatePendingUpload,
        }),
      },
    };
  },
});

export const FASTIFY_STORAGE_MODULE_IMPORTS = {
  generatorName: '@baseplate-dev/plugin-storage#fastify/storage-module',
  task: fastifyStorageModuleImportsTask,
};
