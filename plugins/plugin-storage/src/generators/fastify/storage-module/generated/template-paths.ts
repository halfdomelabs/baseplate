import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface FastifyStorageModulePaths {
  adaptersIndex: string;
  adaptersS_3: string;
  adaptersTypes: string;
  adaptersUrl: string;
  constantsAdapters: string;
  constantsFileCategories: string;
  schemaFileUploadInputType: string;
  schemaPresignedMutations: string;
  schemaPublicUrlField: string;
  servicesCreatePresignedDownloadUrl: string;
  servicesCreatePresignedUploadUrl: string;
  servicesDownloadFile: string;
  servicesUploadFile: string;
  servicesValidateUploadInput: string;
  utilsMime: string;
  utilsMimeUnitTest: string;
  utilsUpload: string;
}

const fastifyStorageModulePaths = createProviderType<FastifyStorageModulePaths>(
  'fastify-storage-module-paths',
);

const fastifyStorageModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { fastifyStorageModulePaths: fastifyStorageModulePaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        fastifyStorageModulePaths: {
          adaptersIndex: `${moduleRoot}/adapters/index.ts`,
          adaptersS_3: `${moduleRoot}/adapters/s3.ts`,
          adaptersTypes: `${moduleRoot}/adapters/types.ts`,
          adaptersUrl: `${moduleRoot}/adapters/url.ts`,
          constantsAdapters: `${moduleRoot}/constants/adapters.ts`,
          constantsFileCategories: `${moduleRoot}/constants/file-categories.ts`,
          schemaFileUploadInputType: `${moduleRoot}/schema/file-upload.input-type.ts`,
          schemaPresignedMutations: `${moduleRoot}/schema/presigned.mutations.ts`,
          schemaPublicUrlField: `${moduleRoot}/schema/public-url.field.ts`,
          servicesCreatePresignedDownloadUrl: `${moduleRoot}/services/create-presigned-download-url.ts`,
          servicesCreatePresignedUploadUrl: `${moduleRoot}/services/create-presigned-upload-url.ts`,
          servicesDownloadFile: `${moduleRoot}/services/download-file.ts`,
          servicesUploadFile: `${moduleRoot}/services/upload-file.ts`,
          servicesValidateUploadInput: `${moduleRoot}/services/validate-upload-input.ts`,
          utilsMime: `${moduleRoot}/utils/mime.ts`,
          utilsMimeUnitTest: `${moduleRoot}/utils/mime.unit.test.ts`,
          utilsUpload: `${moduleRoot}/utils/upload.ts`,
        },
      },
    };
  },
});

export const FASTIFY_STORAGE_MODULE_PATHS = {
  provider: fastifyStorageModulePaths,
  task: fastifyStorageModulePathsTask,
};
