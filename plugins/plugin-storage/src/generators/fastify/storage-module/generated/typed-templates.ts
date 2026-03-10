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
import { queueServiceImportsProvider } from '@baseplate-dev/plugin-queue';
import path from 'node:path';

const configAdapters = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'config-adapters',
  projectExports: {
    STORAGE_ADAPTERS: {},
    StorageAdapterKey: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/config/adapters.config.ts',
    ),
  },
  variables: { TPL_ADAPTERS: {} },
});

const configCategories = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'config-categories',
  projectExports: {
    FILE_CATEGORIES: {},
    FileCategoryName: { isTypeOnly: true },
    getCategoryByName: {},
    getCategoryByNameOrThrow: {},
  },
  referencedGeneratorTemplates: { typesFileCategory: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/config/categories.config.ts',
    ),
  },
  variables: { TPL_FILE_CATEGORIES: {} },
});

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
  referencedGeneratorTemplates: { configCategories: {}, utilsGetAdapter: {} },
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
  referencedGeneratorTemplates: { configCategories: {}, utilsGetAdapter: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/download-file.ts',
    ),
  },
  variables: { TPL_FILE_MODEL: {} },
});

const servicesFileField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    dataUtilsImports: dataUtilsImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
  },
  name: 'services-file-field',
  projectExports: {
    fileField: { isTypeOnly: false },
    FileInput: { isTypeOnly: true },
  },
  referencedGeneratorTemplates: {
    typesFileCategory: {},
    utilsValidatePendingUpload: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/file-field.ts',
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
  referencedGeneratorTemplates: { configAdapters: {} },
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
    configCategories: {},
    typesAdapter: {},
    typesFileCategory: {},
    utilsGetAdapter: {},
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
  servicesFileField,
  servicesUploadFile,
  typesAdapter,
  typesFileCategory,
  utilsCreateFileCategory,
  utilsMime,
  utilsValidateFileUploadOptions,
};

const queuesCleanUnusedFiles = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: { queueServiceImports: queueServiceImportsProvider },
  name: 'queues-clean-unused-files',
  projectExports: { cleanUnusedFilesQueue: { isTypeOnly: false } },
  referencedGeneratorTemplates: { servicesCleanUnusedFiles: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/clean-unused-files.ts',
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
  referencedGeneratorTemplates: { configCategories: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/file-category.enum.ts',
    ),
  },
  variables: {},
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
  },
  name: 'services-clean-unused-files',
  projectExports: { cleanUnusedFiles: { isTypeOnly: false } },
  referencedGeneratorTemplates: { configCategories: {}, utilsGetAdapter: {} },
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
  },
  name: 'services-get-public-url',
  referencedGeneratorTemplates: { utilsGetAdapter: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/get-public-url.ts',
    ),
  },
  variables: { TPL_FILE_MODEL: {} },
});

const utilsGetAdapter = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'utils-get-adapter',
  projectExports: { getAdapterOrThrow: { isTypeOnly: false } },
  referencedGeneratorTemplates: { configAdapters: {}, typesAdapter: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/utils/get-adapter.ts',
    ),
  },
  variables: {},
});

const utilsValidatePendingUpload = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    dataUtilsImports: dataUtilsImportsProvider,
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
  referencedGeneratorTemplates: {
    typesAdapter: {},
    typesFileCategory: {},
    utilsGetAdapter: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/utils/validate-pending-upload.ts',
    ),
  },
  variables: {},
});

export const FASTIFY_STORAGE_MODULE_TEMPLATES = {
  configAdapters,
  configCategories,
  mainGroup,
  queuesCleanUnusedFiles,
  schemaGroup,
  servicesCleanUnusedFiles,
  servicesGetPublicUrl,
  utilsGetAdapter,
  utilsValidatePendingUpload,
};
