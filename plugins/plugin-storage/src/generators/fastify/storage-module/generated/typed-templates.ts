import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  dataUtilsImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
  pothosImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
  serviceContextImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { queuesImportsProvider } from '@baseplate-dev/plugin-queue';
import path from 'node:path';

const adaptersS_3 = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'adapters-s-3',
  projectExports: { createS3Adapter: {} },
  referencedGeneratorTemplates: { typesAdapter: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/module/adapters/s3.ts'),
  },
  variables: {},
});

const adaptersUrl = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'adapters-url',
  projectExports: { createUrlAdapter: {} },
  referencedGeneratorTemplates: { typesAdapter: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/module/adapters/url.ts'),
  },
  variables: {},
});

const servicesCreatePresignedDownloadUrl = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-create-presigned-download-url',
  projectExports: { createPresignedDownloadUrl: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/create-presigned-download-url.ts',
    ),
  },
  variables: { TPL_FILE_MODEL: {} },
});

const servicesCreatePresignedUploadUrl = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-create-presigned-upload-url',
  projectExports: { createPresignedUploadUrl: {} },
  referencedGeneratorTemplates: { utilsValidateFileUploadOptions: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/create-presigned-upload-url.ts',
    ),
  },
  variables: { TPL_FILE_MODEL: {}, TPL_FILE_MODEL_TYPE: {} },
});

const servicesDownloadFile = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-download-file',
  projectExports: { downloadFile: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/download-file.ts',
    ),
  },
  variables: { TPL_FILE_MODEL: {} },
});

const servicesFileTransformer = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: { dataUtilsImports: dataUtilsImportsProvider },
  name: 'services-file-transformer',
  projectExports: {
    FileConnect: { isTypeOnly: true },
    FileDisconnect: { isTypeOnly: true },
    FileInput: { isTypeOnly: true },
    fileInputSchema: { isTypeOnly: false },
    fileNullableInputSchema: { isTypeOnly: false },
    fileTransformer: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: {
    typesFileCategory: {},
    utilsValidatePendingUpload: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/file-transformer.ts',
    ),
  },
  variables: {},
});

const servicesUploadFile = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'services-upload-file',
  projectExports: {},
  referencedGeneratorTemplates: { utilsValidateFileUploadOptions: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/upload-file.ts',
    ),
  },
  variables: { TPL_FILE_MODEL: {}, TPL_FILE_MODEL_TYPE: {} },
});

const typesAdapter = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'types-adapter',
  projectExports: {
    CreatePresignedUploadOptions: { isTypeOnly: true },
    FileMetadata: { isTypeOnly: true },
    PresignedUploadUrl: { isTypeOnly: true },
    StorageAdapter: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/types/adapter.ts',
    ),
  },
  variables: {},
});

const typesFileCategory = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'types-file-category',
  projectExports: { FileCategory: { isTypeOnly: true } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/types/file-category.ts',
    ),
  },
  variables: {},
});

const utilsCreateFileCategory = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    prismaGeneratedImports: prismaGeneratedImportsProvider,
  },
  name: 'utils-create-file-category',
  projectExports: { createFileCategory: {}, FileSize: {}, MimeTypes: {} },
  referencedGeneratorTemplates: { typesFileCategory: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/utils/create-file-category.ts',
    ),
  },
  variables: {},
});

const utilsMime = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
  name: 'utils-mime',
  projectExports: {
    getEncodingFromContentType: {},
    getMimeTypeFromContentType: {},
    InvalidMimeTypeError: {},
    validateFileExtensionWithMimeType: {},
  },
  source: {
    path: path.join(import.meta.dirname, '../templates/module/utils/mime.ts'),
  },
  variables: {},
});

const utilsValidateFileUploadOptions = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'utils-validate-file-upload-options',
  projectExports: {
    FileUploadOptions: { isTypeOnly: true },
    validateFileUploadOptions: {},
  },
  referencedGeneratorTemplates: {
    typesAdapter: {},
    typesFileCategory: {},
    utilsMime: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/utils/validate-file-upload-options.ts',
    ),
  },
  variables: { TPL_FILE_CREATE_INPUT: {} },
});

export const mainGroup = {
  adaptersS_3,
  adaptersUrl,
  servicesCreatePresignedDownloadUrl,
  servicesCreatePresignedUploadUrl,
  servicesDownloadFile,
  servicesFileTransformer,
  servicesUploadFile,
  typesAdapter,
  typesFileCategory,
  utilsCreateFileCategory,
  utilsMime,
  utilsValidateFileUploadOptions,
};

const queuesCleanUnusedFiles = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { queuesImports: queuesImportsProvider },
  name: 'queues-clean-unused-files',
  projectExports: { cleanUnusedFilesQueue: { isTypeOnly: false } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/clean-unused-files.queue.ts',
    ),
  },
  variables: {},
});

const queuesCleanUnusedFilesWorker = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    queuesImports: queuesImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'queues-clean-unused-files-worker',
  projectExports: { cleanUnusedFilesWorker: { isTypeOnly: false } },
  referencedGeneratorTemplates: {
    queuesCleanUnusedFiles: {},
    servicesCleanUnusedFiles: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/clean-unused-files.worker.ts',
    ),
  },
  variables: {},
});

const schemaFileCategory = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-file-category',
  projectExports: {},
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/file-category.enum.ts',
    ),
  },
  variables: { TPL_FILE_CATEGORY_ENUM_NAMES: {} },
});

const schemaFileInput = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-file-input',
  projectExports: { fileInputInputType: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/file-input.input-type.ts',
    ),
  },
  variables: {},
});

const schemaPresignedMutations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-presigned-mutations',
  projectExports: {},
  referencedGeneratorTemplates: {
    schemaFileCategory: {},
    servicesCreatePresignedDownloadUrl: {},
    servicesCreatePresignedUploadUrl: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/presigned.mutations.ts',
    ),
  },
  variables: { TPL_FILE_OBJECT_TYPE: {} },
});

const schemaPublicUrl = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-public-url',
  projectExports: {},
  referencedGeneratorTemplates: { servicesGetPublicUrl: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/public-url.field.ts',
    ),
  },
  variables: { TPL_FILE_OBJECT_TYPE: {} },
});

export const schemaGroup = {
  schemaFileCategory,
  schemaFileInput,
  schemaPresignedMutations,
  schemaPublicUrl,
};

const servicesCleanUnusedFiles = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    prismaImports: prismaImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-clean-unused-files',
  projectExports: { cleanUnusedFiles: { isTypeOnly: false } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/clean-unused-files.ts',
    ),
  },
  variables: {},
});

const servicesGetPublicUrl = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-get-public-url',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/get-public-url.ts',
    ),
  },
  variables: { TPL_FILE_MODEL: {} },
});

const servicesStorage = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'services-storage',
  projectExports: {
    createStorageService: { isTypeOnly: false },
    StorageAdapterKey: { isTypeOnly: true },
    StorageService: { isTypeOnly: true },
  },
  referencedGeneratorTemplates: { typesAdapter: {}, typesFileCategory: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/storage.service.ts',
    ),
  },
  variables: { TPL_ADAPTERS: {} },
});

const storageTestHelper = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'storage-test-helper',
  projectExports: {
    createFakeStorageAdapter: { isTypeOnly: false },
    createFakeStorageService: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: {
    servicesStorage: {},
    typesAdapter: {},
    typesFileCategory: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/tests/helpers/storage.test-helper.ts',
    ),
  },
  variables: {},
});

const utilsValidatePendingUpload = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'utils-validate-pending-upload',
  projectExports: {
    ValidatedPendingUpload: { isTypeOnly: true },
    validatePendingUpload: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: { typesFileCategory: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/utils/validate-pending-upload.ts',
    ),
  },
  variables: {},
});

export const FASTIFY_STORAGE_MODULE_TEMPLATES = {
  mainGroup,
  queuesCleanUnusedFiles,
  queuesCleanUnusedFilesWorker,
  schemaGroup,
  servicesCleanUnusedFiles,
  servicesGetPublicUrl,
  servicesStorage,
  storageTestHelper,
  utilsValidatePendingUpload,
};
