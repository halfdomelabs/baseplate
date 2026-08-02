import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  CORE_PACKAGES,
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  appModuleConfigProvider,
  appModuleFieldTypesProvider,
  appModuleProvider,
  appRuntimeConfigProvider,
  configServiceImportsProvider,
  configServiceProvider,
  createPothosTypeReference,
  pothosConfigProvider,
  pothosSchemaProvider,
  pothosTypeOutputProvider,
  prismaGeneratedImportsProvider,
  prismaOutputProvider,
} from '@baseplate-dev/fastify-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { compareStrings, quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { STORAGE_PACKAGES } from '#src/constants/index.js';
import { STORAGE_MODELS } from '#src/storage/constants/model-names.js';

import { FASTIFY_STORAGE_MODULE_GENERATED } from './generated/index.js';
import { storageModuleImportsProvider } from './generated/ts-import-providers.js';

const descriptorSchema = z.object({
  /**
   * The S3 adapters to use for the storage module.
   */
  s3Adapters: z.array(
    z.object({
      /**
       * The name of the adapter.
       */
      name: z.string().min(1),
      /**
       * The name of the config variable for the bucket.
       */
      bucketConfigVar: z.string().min(1),
      hostedUrlConfigVar: z.string().optional(),
    }),
  ),
});

/**
 * Collects file category NAMES for the static GraphQL enum. Names only (no
 * paths), so registering does not depend on any module's own paths provider.
 */
const [
  configTask,
  storageModuleConfigProvider,
  storageModuleConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    /** File category names, used to build the GraphQL enum values. */
    fileCategoryNames: t.map<string, string>(),
  }),
  {
    prefix: 'storage-module',
    configScope: packageScope,
  },
);

export { storageModuleConfigProvider };

export const storageModuleGenerator = createGenerator({
  name: 'fastify/storage-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ s3Adapters }) => ({
    paths: FASTIFY_STORAGE_MODULE_GENERATED.paths.task,
    imports: FASTIFY_STORAGE_MODULE_GENERATED.imports.task,
    renderers: FASTIFY_STORAGE_MODULE_GENERATED.renderers.task,
    config: configTask,
    nodePackages: createNodePackagesTask({
      prod: {
        ...extractPackageVersions(CORE_PACKAGES, ['axios']),
        ...extractPackageVersions(STORAGE_PACKAGES, [
          '@aws-sdk/client-s3',
          '@aws-sdk/lib-storage',
          '@aws-sdk/s3-presigned-post',
          '@aws-sdk/s3-request-presigner',
          'mime-types',
        ]),
      },
      dev: extractPackageVersions(STORAGE_PACKAGES, ['@types/mime-types']),
    }),
    setupFileInputSchema: createGeneratorTask({
      dependencies: {
        pothosConfig: pothosConfigProvider,
        paths: FASTIFY_STORAGE_MODULE_GENERATED.paths.provider,
      },
      run({ pothosConfig, paths }) {
        pothosConfig.inputTypes.set(
          'FileUploadInput',
          createPothosTypeReference({
            name: 'FileUploadInput',
            exportName: 'fileInputInputType',
            moduleSpecifier: paths.schemaFileInput,
          }),
        );

        return {};
      },
    }),
    renderSchema: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
        renderers: FASTIFY_STORAGE_MODULE_GENERATED.renderers.provider,
        pothosSchema: pothosSchemaProvider,
        storageModuleConfigValues: storageModuleConfigValuesProvider,
        fileObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(`prisma-object-type:${STORAGE_MODELS.file}`),
        paths: FASTIFY_STORAGE_MODULE_GENERATED.paths.provider,
      },
      run({
        appModule,
        pothosSchema,
        renderers,
        storageModuleConfigValues,
        fileObjectType,
        paths,
      }) {
        const { schemaGroup } = FASTIFY_STORAGE_MODULE_GENERATED.templates;
        for (const template of Object.keys(schemaGroup)) {
          const renderedPath = paths[template as keyof typeof schemaGroup];
          appModule.moduleImports.push(renderedPath);
          pothosSchema.registerSchemaFile(renderedPath);
        }
        return {
          build: async (builder) => {
            const fileObjectRef = fileObjectType.getTypeReference();
            const categoryNames = [
              ...storageModuleConfigValues.fileCategoryNames.keys(),
            ].toSorted(compareStrings);
            await builder.apply(
              renderers.schemaGroup.render({
                variables: {
                  schemaFileCategory: {
                    TPL_FILE_CATEGORY_ENUM_NAMES: TsCodeUtils.template`${TsCodeUtils.mergeFragmentsAsArrayPresorted(
                      categoryNames.map((name) => quot(name)),
                    )} as const`,
                  },
                  schemaPresignedMutations: {
                    TPL_FILE_OBJECT_TYPE: fileObjectRef.fragment,
                  },
                  schemaPublicUrl: {
                    TPL_FILE_OBJECT_TYPE: fileObjectRef.fragment,
                  },
                },
              }),
            );
          },
        };
      },
    }),
    configService: createProviderTask(
      configServiceProvider,
      (configService) => {
        configService.configFields.mergeObj({
          AWS_ACCESS_KEY_ID: {
            comment: 'AWS access key ID',
            validator: tsCodeFragment('z.string().min(1)'),
            seedValue: 'AWS_ACCESS_KEY_ID',
          },
          AWS_SECRET_ACCESS_KEY: {
            comment: 'AWS secret access key',
            validator: tsCodeFragment('z.string().min(1)'),
            seedValue: 'AWS_SECRET_ACCESS_KEY',
          },
          AWS_DEFAULT_REGION: {
            comment: 'AWS default region',
            validator: tsCodeFragment('z.string().min(1)'),
            seedValue: 'AWS_DEFAULT_REGION',
          },
        });

        for (const adapter of s3Adapters) {
          configService.configFields.set(adapter.bucketConfigVar, {
            comment: `S3 bucket for ${adapter.name}`,
            validator: tsCodeFragment('z.string().min(1)'),
            seedValue: adapter.bucketConfigVar,
          });

          if (adapter.hostedUrlConfigVar) {
            configService.configFields.set(adapter.hostedUrlConfigVar, {
              comment: `Hosted URL prefix for ${adapter.name}, e.g. https://uploads.example.com`,
              validator: tsCodeFragment('z.string().min(1)'),
              seedValue: adapter.hostedUrlConfigVar,
            });
          }
        }
      },
    ),
    build: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        configServiceImports: configServiceImportsProvider,
        renderers: FASTIFY_STORAGE_MODULE_GENERATED.renderers.provider,
        storageModuleImports: storageModuleImportsProvider,
        prismaGeneratedImports: prismaGeneratedImportsProvider,
        appModule: appModuleProvider,
        paths: FASTIFY_STORAGE_MODULE_GENERATED.paths.provider,
      },
      run({
        prismaOutput,
        configServiceImports,
        renderers,
        storageModuleImports,
        prismaGeneratedImports,
        appModule,
        paths,
      }) {
        return {
          build: async (builder) => {
            const model = prismaOutput.getPrismaModelFragment(
              STORAGE_MODELS.file,
            );
            const modelType = prismaOutput.getModelTypeFragment(
              STORAGE_MODELS.file,
            );
            // Render module
            await builder.apply(
              renderers.mainGroup.render({
                variables: {
                  servicesCreatePresignedDownloadUrl: {
                    TPL_FILE_MODEL: model,
                  },
                  servicesCreatePresignedUploadUrl: {
                    TPL_FILE_MODEL: model,
                    TPL_FILE_MODEL_TYPE: modelType,
                  },
                  servicesDownloadFile: {
                    TPL_FILE_MODEL: model,
                  },
                  servicesUploadFile: {
                    TPL_FILE_MODEL: model,
                    TPL_FILE_MODEL_TYPE: modelType,
                  },
                  utilsValidateFileUploadOptions: {
                    TPL_FILE_CREATE_INPUT: tsCodeFragment(
                      `Prisma.${STORAGE_MODELS.file}CreateInput`,
                      prismaGeneratedImports.Prisma.typeDeclaration(),
                    ),
                  },
                },
              }),
            );

            // Render servicesGetPublicUrl template
            await builder.apply(
              renderers.servicesGetPublicUrl.render({
                variables: {
                  TPL_FILE_MODEL: model,
                },
              }),
            );

            // Render adapters config
            const adapterMap = new Map<string, TsCodeFragment>();

            for (const adapter of s3Adapters) {
              const adapterOptions = TsCodeUtils.mergeFragmentsAsObject({
                bucket: `config.${adapter.bucketConfigVar}`,
                region: `config.AWS_DEFAULT_REGION`,
                publicUrl: adapter.hostedUrlConfigVar
                  ? `config.${adapter.hostedUrlConfigVar}`
                  : undefined,
              });

              adapterMap.set(
                adapter.name,
                TsCodeUtils.templateWithImports([
                  storageModuleImports.createS3Adapter.declaration(),
                  configServiceImports.config.declaration(),
                ])`createS3Adapter(${adapterOptions})`,
              );
            }

            adapterMap.set(
              'url',
              tsCodeFragment(
                'createUrlAdapter()',
                storageModuleImports.createUrlAdapter.declaration(),
              ),
            );

            await builder.apply(
              renderers.servicesStorage.render({
                variables: {
                  TPL_ADAPTERS: TsCodeUtils.mergeFragmentsAsObject(adapterMap),
                },
              }),
            );

            // Render standalone utility templates
            await builder.apply(
              renderers.utilsValidatePendingUpload.render({}),
            );

            await builder.apply(renderers.storageTestHelper.render({}));

            // Render clean-unused-files service
            await builder.apply(renderers.servicesCleanUnusedFiles.render({}));

            // Render queue
            await builder.apply(renderers.queuesCleanUnusedFiles.render({}));
            await builder.apply(
              renderers.queuesCleanUnusedFilesWorker.render({}),
            );

            // Register with the app module's queues field
            appModule.moduleFields.set(
              'queues',
              'cleanUnusedFilesWorker',
              tsCodeFragment(
                'cleanUnusedFilesWorker',
                tsImportBuilder(['cleanUnusedFilesWorker']).from(
                  paths.queuesCleanUnusedFilesWorker,
                ),
              ),
            );
          },
        };
      },
    }),
    // Declared without a type here (no path needed, so no dependency on this
    // module's own paths) and bound below, once `paths` can be resolved.
    appModuleConfig: createGeneratorTask({
      dependencies: {
        appModuleConfig: appModuleConfigProvider,
      },
      run({ appModuleConfig }) {
        appModuleConfig.moduleFields.set('storageCategories', undefined);
      },
    }),
    appModuleFieldTypes: createGeneratorTask({
      dependencies: {
        appModuleFieldTypes: appModuleFieldTypesProvider,
        paths: FASTIFY_STORAGE_MODULE_GENERATED.paths.provider,
      },
      run({ appModuleFieldTypes, paths }) {
        appModuleFieldTypes.setFieldType(
          'storageCategories',
          TsCodeUtils.typeImportFragment(
            'FileCategory',
            paths.typesFileCategory,
          ),
        );
      },
    }),
    appRuntimeConfig: createGeneratorTask({
      dependencies: {
        appRuntimeConfig: appRuntimeConfigProvider,
        paths: FASTIFY_STORAGE_MODULE_GENERATED.paths.provider,
      },
      run({ appRuntimeConfig, paths }) {
        appRuntimeConfig.services.set('storage', {
          type: TsCodeUtils.typeImportFragment(
            'StorageService',
            paths.servicesStorage,
          ),
        });
        appRuntimeConfig.flattenedModuleFields.set(
          'storageCategories',
          'storageCategories',
        );
        appRuntimeConfig.construction.set('storage', {
          fragment: TsCodeUtils.template`${TsCodeUtils.importFragment('createStorageService', paths.servicesStorage)}(storageCategories)`,
        });
      },
    }),
  }),
});
