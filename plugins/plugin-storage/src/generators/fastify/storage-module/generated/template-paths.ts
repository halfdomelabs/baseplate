import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface FastifyStorageModulePaths {
  adaptersS_3: string;
  adaptersUrl: string;
  queuesCleanUnusedFiles: string;
  queuesCleanUnusedFilesWorker: string;
  schemaFileCategory: string;
  schemaFileInput: string;
  schemaPresignedMutations: string;
  schemaPublicUrl: string;
  servicesCleanUnusedFiles: string;
  servicesCreatePresignedDownloadUrl: string;
  servicesCreatePresignedUploadUrl: string;
  servicesDownloadFile: string;
  servicesFileTransformer: string;
  servicesGetPublicUrl: string;
  servicesStorage: string;
  servicesUploadFile: string;
  storageTestHelper: string;
  typesAdapter: string;
  typesFileCategory: string;
  utilsCreateFileCategory: string;
  utilsMime: string;
  utilsValidateFileUploadOptions: string;
  utilsValidatePendingUpload: string;
}

const fastifyStorageModulePaths = createProviderType<FastifyStorageModulePaths>(
  'fastify-storage-module-paths',
);

const fastifyStorageModulePathsTask = createGeneratorTask({
  dependencies: {
    appModule: appModuleProvider,
    packageInfo: packageInfoProvider,
  },
  exports: { fastifyStorageModulePaths: fastifyStorageModulePaths.export() },
  run({ appModule, packageInfo }) {
    const moduleRoot = appModule.getModuleFolder();
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        fastifyStorageModulePaths: {
          adaptersS_3: `${moduleRoot}/adapters/s3.ts`,
          adaptersUrl: `${moduleRoot}/adapters/url.ts`,
          queuesCleanUnusedFiles: `${moduleRoot}/queues/clean-unused-files.queue.ts`,
          queuesCleanUnusedFilesWorker: `${moduleRoot}/queues/clean-unused-files.worker.ts`,
          schemaFileCategory: `${moduleRoot}/schema/file-category.enum.ts`,
          schemaFileInput: `${moduleRoot}/schema/file-input.input-type.ts`,
          schemaPresignedMutations: `${moduleRoot}/schema/presigned.mutations.ts`,
          schemaPublicUrl: `${moduleRoot}/schema/public-url.field.ts`,
          servicesCleanUnusedFiles: `${moduleRoot}/services/clean-unused-files.ts`,
          servicesCreatePresignedDownloadUrl: `${moduleRoot}/services/create-presigned-download-url.ts`,
          servicesCreatePresignedUploadUrl: `${moduleRoot}/services/create-presigned-upload-url.ts`,
          servicesDownloadFile: `${moduleRoot}/services/download-file.ts`,
          servicesFileTransformer: `${moduleRoot}/services/file-transformer.ts`,
          servicesGetPublicUrl: `${moduleRoot}/services/get-public-url.ts`,
          servicesStorage: `${moduleRoot}/services/storage.service.ts`,
          servicesUploadFile: `${moduleRoot}/services/upload-file.ts`,
          storageTestHelper: `${srcRoot}/tests/helpers/storage.test-helper.ts`,
          typesAdapter: `${moduleRoot}/types/adapter.ts`,
          typesFileCategory: `${moduleRoot}/types/file-category.ts`,
          utilsCreateFileCategory: `${moduleRoot}/utils/create-file-category.ts`,
          utilsMime: `${moduleRoot}/utils/mime.ts`,
          utilsValidateFileUploadOptions: `${moduleRoot}/utils/validate-file-upload-options.ts`,
          utilsValidatePendingUpload: `${moduleRoot}/utils/validate-pending-upload.ts`,
        },
      },
    };
  },
});

export const FASTIFY_STORAGE_MODULE_PATHS = {
  provider: fastifyStorageModulePaths,
  task: fastifyStorageModulePathsTask,
};
