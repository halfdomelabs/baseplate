import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  pothosImportsProvider,
  prismaUtilsImportsProvider,
  serviceContextImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

const adaptersIndex = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'adapters',
  importMapProviders: {},
  name: 'adapters-index',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/adapters/index.ts',
    ),
  },
  variables: {},
});

const adaptersS_3 = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'adapters',
  importMapProviders: {},
  name: 'adapters-s-3',
  source: {
    path: path.join(import.meta.dirname, '../templates/module/adapters/s3.ts'),
  },
  variables: {},
});

const adaptersTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'adapters',
  importMapProviders: {},
  name: 'adapters-types',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/adapters/types.ts',
    ),
  },
  variables: {},
});

const adaptersUrl = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'adapters',
  importMapProviders: {},
  name: 'adapters-url',
  source: {
    path: path.join(import.meta.dirname, '../templates/module/adapters/url.ts'),
  },
  variables: {},
});

export const adaptersGroup = {
  adaptersIndex,
  adaptersS_3,
  adaptersTypes,
  adaptersUrl,
};

const constantsAdapters = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'constants',
  importMapProviders: {},
  name: 'constants-adapters',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/constants/adapters.ts',
    ),
  },
  variables: { TPL_ADAPTERS: {} },
});

const constantsFileCategories = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'constants',
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'constants-file-categories',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/constants/file-categories.ts',
    ),
  },
  variables: {
    TPL_FILE_CATEGORIES: {},
    TPL_FILE_COUNT_OUTPUT_TYPE: {},
    TPL_FILE_MODEL_TYPE: {},
  },
});

export const constantsGroup = { constantsAdapters, constantsFileCategories };

const schemaFileUploadInputType = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-file-upload-input-type',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/file-upload.input-type.ts',
    ),
  },
  variables: {},
});

const schemaHostedUrlField = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-hosted-url-field',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/hosted-url.field.ts',
    ),
  },
  variables: { TPL_FILE_OBJECT_TYPE: {} },
});

const schemaPresignedMutations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-presigned-mutations',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/schema/presigned.mutations.ts',
    ),
  },
  variables: { TPL_FILE_OBJECT_TYPE: {} },
});

export const schemaGroup = {
  schemaFileUploadInputType,
  schemaHostedUrlField,
  schemaPresignedMutations,
};

const servicesCreatePresignedDownloadUrl = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'services',
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
  group: 'services',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-create-presigned-upload-url',
  projectExports: {
    createPresignedUploadUrl: {},
    CreatePresignedUploadUrlPayload: { isTypeOnly: true },
  },
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
  group: 'services',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
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

const servicesUploadFile = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'services',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-upload-file',
  projectExports: { uploadFile: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/upload-file.ts',
    ),
  },
  variables: { TPL_FILE_MODEL: {}, TPL_FILE_MODEL_TYPE: {} },
});

const servicesValidateUploadInput = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'services',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaUtilsImports: prismaUtilsImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-validate-upload-input',
  projectExports: {
    FileUploadInput: { isTypeOnly: true },
    validateFileUploadInput: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/validate-upload-input.ts',
    ),
  },
  variables: { TPL_FILE_MODEL: {} },
});

export const servicesGroup = {
  servicesCreatePresignedDownloadUrl,
  servicesCreatePresignedUploadUrl,
  servicesDownloadFile,
  servicesUploadFile,
  servicesValidateUploadInput,
};

const utilsMime = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {},
  name: 'utils-mime',
  projectExports: {
    getMimeTypeFromContentType: {},
    validateFileExtensionWithMimeType: {},
  },
  source: {
    path: path.join(import.meta.dirname, '../templates/module/utils/mime.ts'),
  },
  variables: {},
});

const utilsMimeUnitTest = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {},
  name: 'utils-mime-unit-test',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/utils/mime.unit.test.ts',
    ),
  },
  variables: {},
});

const utilsUpload = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'utils',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'utils-upload',
  projectExports: {
    prepareUploadData: {},
    UploadDataInput: { isTypeOnly: true },
  },
  source: {
    path: path.join(import.meta.dirname, '../templates/module/utils/upload.ts'),
  },
  variables: { TPL_FILE_CREATE_INPUT: {} },
});

export const utilsGroup = { utilsMime, utilsMimeUnitTest, utilsUpload };

export const FASTIFY_STORAGE_MODULE_TEMPLATES = {
  adaptersGroup,
  constantsGroup,
  schemaGroup,
  servicesGroup,
  utilsGroup,
};
