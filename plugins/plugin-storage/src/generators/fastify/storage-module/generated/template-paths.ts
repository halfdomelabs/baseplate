import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface FastifyStorageModulePaths {
  adaptersS_3: string;
  adaptersUrl: string;
  configAdapters: string;
  configCategories: string;
  schemaFileCategory: string;
  schemaFileInput: string;
  schemaPresignedMutations: string;
  schemaPublicUrl: string;
  servicesCreatePresignedDownloadUrl: string;
  servicesCreatePresignedUploadUrl: string;
  servicesDownloadFile: string;
  servicesUploadFile: string;
  servicesValidateFileInput: string;
  typesAdapter: string;
  typesFileCategory: string;
  utilsCreateFileCategory: string;
  utilsMime: string;
  utilsValidateFileUploadOptions: string;
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
          adaptersS_3: `${moduleRoot}/adapters/s3.ts`,
          adaptersUrl: `${moduleRoot}/adapters/url.ts`,
          configAdapters: `${moduleRoot}/config/adapters.config.ts`,
          configCategories: `${moduleRoot}/config/categories.config.ts`,
          schemaFileCategory: `${moduleRoot}/schema/file-category.enum.ts`,
          schemaFileInput: `${moduleRoot}/schema/file-input.input-type.ts`,
          schemaPresignedMutations: `${moduleRoot}/schema/presigned.mutations.ts`,
          schemaPublicUrl: `${moduleRoot}/schema/public-url.field.ts`,
          servicesCreatePresignedDownloadUrl: `${moduleRoot}/services/create-presigned-download-url.ts`,
          servicesCreatePresignedUploadUrl: `${moduleRoot}/services/create-presigned-upload-url.ts`,
          servicesDownloadFile: `${moduleRoot}/services/download-file.ts`,
          servicesUploadFile: `${moduleRoot}/services/upload-file.ts`,
          servicesValidateFileInput: `${moduleRoot}/services/validate-file-input.ts`,
          typesAdapter: `${moduleRoot}/types/adapter.ts`,
          typesFileCategory: `${moduleRoot}/types/file-category.ts`,
          utilsCreateFileCategory: `${moduleRoot}/utils/create-file-category.ts`,
          utilsMime: `${moduleRoot}/utils/mime.ts`,
          utilsValidateFileUploadOptions: `${moduleRoot}/utils/validate-file-upload-options.ts`,
        },
      },
    };
  },
});

export const FASTIFY_STORAGE_MODULE_PATHS = {
  provider: fastifyStorageModulePaths,
  task: fastifyStorageModulePathsTask,
};
