import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  pothosImportsProvider,
  prismaUtilsImportsProvider,
  serviceContextImportsProvider,
} from '@baseplate-dev/fastify-generators';
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
  referencedGeneratorTemplates: { configAdapters: {}, configCategories: {} },
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
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-download-file',
  projectExports: { downloadFile: {} },
  referencedGeneratorTemplates: { configAdapters: {}, configCategories: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/download-file.ts',
    ),
  },
  variables: { TPL_FILE_MODEL: {} },
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

const servicesValidateFileInput = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaUtilsImports: prismaUtilsImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-validate-file-input',
  projectExports: {
    FileUploadInput: { isTypeOnly: true },
    validateFileInput: {},
  },
  referencedGeneratorTemplates: { configAdapters: {}, typesFileCategory: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/validate-file-input.ts',
    ),
  },
  variables: { TPL_FILE_MODEL: {} },
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
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'types-file-category',
  projectExports: { FileCategory: { isTypeOnly: true } },
  referencedGeneratorTemplates: { configAdapters: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/types/file-category.ts',
    ),
  },
  variables: { TPL_FILE_COUNT_OUTPUT_TYPE: {} },
});

const utilsCreateFileCategory = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {},
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
    configAdapters: {},
    configCategories: {},
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
  servicesUploadFile,
  servicesValidateFileInput,
  typesAdapter,
  typesFileCategory,
  utilsCreateFileCategory,
  utilsMime,
  utilsValidateFileUploadOptions,
};

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
  referencedGeneratorTemplates: { configAdapters: {} },
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

export const FASTIFY_STORAGE_MODULE_TEMPLATES = {
  configAdapters,
  configCategories,
  mainGroup,
  schemaGroup,
};
