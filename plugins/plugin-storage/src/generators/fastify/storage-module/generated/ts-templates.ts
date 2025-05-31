import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  pothosImportsProvider,
  prismaUtilsImportsProvider,
  serviceContextImportsProvider,
} from '@baseplate-dev/fastify-generators';

const adaptersIndex = createTsTemplateFile({
  group: 'adapters',
  name: 'adapters-index',
  projectExports: {},
  source: { path: 'adapters/index.ts' },
  variables: {},
});

const adaptersS3 = createTsTemplateFile({
  group: 'adapters',
  name: 'adapters-s-3',
  projectExports: {},
  source: { path: 'adapters/s3.ts' },
  variables: {},
});

const adaptersTypes = createTsTemplateFile({
  group: 'adapters',
  name: 'adapters-types',
  projectExports: {},
  source: { path: 'adapters/types.ts' },
  variables: {},
});

const adaptersUrl = createTsTemplateFile({
  group: 'adapters',
  name: 'adapters-url',
  projectExports: {},
  source: { path: 'adapters/url.ts' },
  variables: {},
});

const adaptersGroup = createTsTemplateGroup({
  templates: {
    adaptersIndex: { destination: 'index.ts', template: adaptersIndex },
    adaptersS3: { destination: 's3.ts', template: adaptersS3 },
    adaptersTypes: { destination: 'types.ts', template: adaptersTypes },
    adaptersUrl: { destination: 'url.ts', template: adaptersUrl },
  },
});

const constantsAdapters = createTsTemplateFile({
  group: 'constants',
  name: 'constants-adapters',
  projectExports: {},
  source: { path: 'constants/adapters.ts' },
  variables: { TPL_ADAPTERS: {} },
});

const constantsFileCategories = createTsTemplateFile({
  group: 'constants',
  importMapProviders: { serviceContextImports: serviceContextImportsProvider },
  name: 'constants-file-categories',
  projectExports: {},
  source: { path: 'constants/file-categories.ts' },
  variables: {
    TPL_FILE_CATEGORIES: {},
    TPL_FILE_COUNT_OUTPUT_TYPE: {},
    TPL_FILE_MODEL_TYPE: {},
  },
});

const constantsGroup = createTsTemplateGroup({
  templates: {
    constantsAdapters: {
      destination: 'adapters.ts',
      template: constantsAdapters,
    },
    constantsFileCategories: {
      destination: 'file-categories.ts',
      template: constantsFileCategories,
    },
  },
});

const schemaFileUploadInputType = createTsTemplateFile({
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-file-upload-input-type',
  projectExports: {},
  source: { path: 'schema/file-upload.input-type.ts' },
  variables: {},
});

const schemaHostedUrlField = createTsTemplateFile({
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-hosted-url-field',
  projectExports: {},
  source: { path: 'schema/hosted-url.field.ts' },
  variables: { TPL_FILE_OBJECT_TYPE: {} },
});

const schemaPresignedMutations = createTsTemplateFile({
  group: 'schema',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-presigned-mutations',
  projectExports: {},
  source: { path: 'schema/presigned.mutations.ts' },
  variables: { TPL_FILE_OBJECT_TYPE: {} },
});

const schemaGroup = createTsTemplateGroup({
  templates: {
    schemaFileUploadInputType: {
      destination: 'file-upload.input-type.ts',
      template: schemaFileUploadInputType,
    },
    schemaHostedUrlField: {
      destination: 'hosted-url.field.ts',
      template: schemaHostedUrlField,
    },
    schemaPresignedMutations: {
      destination: 'presigned.mutations.ts',
      template: schemaPresignedMutations,
    },
  },
});

const servicesCreatePresignedDownloadUrl = createTsTemplateFile({
  group: 'services',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-create-presigned-download-url',
  projectExports: { createPresignedDownloadUrl: {} },
  source: { path: 'services/create-presigned-download-url.ts' },
  variables: { TPL_FILE_MODEL: {} },
});

const servicesCreatePresignedUploadUrl = createTsTemplateFile({
  group: 'services',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-create-presigned-upload-url',
  projectExports: {
    CreatePresignedUploadUrlPayload: { isTypeOnly: true },
    createPresignedUploadUrl: {},
  },
  source: { path: 'services/create-presigned-upload-url.ts' },
  variables: { TPL_FILE_MODEL: {}, TPL_FILE_MODEL_TYPE: {} },
});

const servicesDownloadFile = createTsTemplateFile({
  group: 'services',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-download-file',
  projectExports: { downloadFile: {} },
  source: { path: 'services/download-file.ts' },
  variables: { TPL_FILE_MODEL: {} },
});

const servicesUploadFile = createTsTemplateFile({
  group: 'services',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'services-upload-file',
  projectExports: { uploadFile: {} },
  source: { path: 'services/upload-file.ts' },
  variables: { TPL_FILE_MODEL: {}, TPL_FILE_MODEL_TYPE: {} },
});

const servicesValidateUploadInput = createTsTemplateFile({
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
  source: { path: 'services/validate-upload-input.ts' },
  variables: { TPL_FILE_MODEL: {} },
});

const servicesGroup = createTsTemplateGroup({
  templates: {
    servicesCreatePresignedDownloadUrl: {
      destination: 'create-presigned-download-url.ts',
      template: servicesCreatePresignedDownloadUrl,
    },
    servicesCreatePresignedUploadUrl: {
      destination: 'create-presigned-upload-url.ts',
      template: servicesCreatePresignedUploadUrl,
    },
    servicesDownloadFile: {
      destination: 'download-file.ts',
      template: servicesDownloadFile,
    },
    servicesUploadFile: {
      destination: 'upload-file.ts',
      template: servicesUploadFile,
    },
    servicesValidateUploadInput: {
      destination: 'validate-upload-input.ts',
      template: servicesValidateUploadInput,
    },
  },
});

const utilsMime = createTsTemplateFile({
  group: 'utils',
  name: 'utils-mime',
  projectExports: {
    getMimeTypeFromContentType: {},
    validateFileExtensionWithMimeType: {},
  },
  source: { path: 'utils/mime.ts' },
  variables: {},
});

const utilsMimeUnitTest = createTsTemplateFile({
  group: 'utils',
  name: 'utils-mime-unit-test',
  projectExports: {},
  source: { path: 'utils/mime.unit.test.ts' },
  variables: {},
});

const utilsUpload = createTsTemplateFile({
  group: 'utils',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    serviceContextImports: serviceContextImportsProvider,
  },
  name: 'utils-upload',
  projectExports: {
    UploadDataInput: { isTypeOnly: true },
    prepareUploadData: {},
  },
  source: { path: 'utils/upload.ts' },
  variables: { TPL_FILE_CREATE_INPUT: {} },
});

const utilsGroup = createTsTemplateGroup({
  templates: {
    utilsMime: { destination: 'mime.ts', template: utilsMime },
    utilsMimeUnitTest: {
      destination: 'mime.unit.test.ts',
      template: utilsMimeUnitTest,
    },
    utilsUpload: { destination: 'upload.ts', template: utilsUpload },
  },
});

export const FASTIFY_STORAGE_MODULE_TS_TEMPLATES = {
  adaptersGroup,
  constantsGroup,
  schemaGroup,
  servicesGroup,
  utilsGroup,
};
