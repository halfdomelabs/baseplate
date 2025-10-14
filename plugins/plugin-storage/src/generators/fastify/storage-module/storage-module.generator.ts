import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  CORE_PACKAGES,
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
} from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
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

const [
  configTask,
  storageModuleConfigProvider,
  storageModuleConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    /** Map of file category name to the config fragment for the file category. */
    fileCategories: t.map<string, TsCodeFragment>(),
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
        fileObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(`prisma-object-type:${STORAGE_MODELS.file}`),
        paths: FASTIFY_STORAGE_MODULE_GENERATED.paths.provider,
      },
      run({ appModule, pothosSchema, renderers, fileObjectType, paths }) {
        const { schemaGroup } = FASTIFY_STORAGE_MODULE_GENERATED.templates;
        for (const template of Object.keys(schemaGroup)) {
          const renderedPath = paths[template as keyof typeof schemaGroup];
          appModule.moduleImports.push(renderedPath);
          pothosSchema.registerSchemaFile(renderedPath);
        }
        return {
          build: async (builder) => {
            const fileObjectRef = fileObjectType.getTypeReference();
            await builder.apply(
              renderers.schemaGroup.render({
                variables: {
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
        storageModuleConfigValues: storageModuleConfigValuesProvider,
        prismaGeneratedImports: prismaGeneratedImportsProvider,
      },
      run({
        prismaOutput,
        configServiceImports,
        renderers,
        storageModuleImports,
        storageModuleConfigValues,
        prismaGeneratedImports,
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
                  servicesValidateFileInput: {
                    TPL_FILE_MODEL: model,
                  },
                  typesFileCategory: {
                    TPL_FILE_COUNT_OUTPUT_TYPE: tsCodeFragment(
                      `Prisma.${STORAGE_MODELS.file}CountOutputType`,
                      prismaGeneratedImports.Prisma.typeDeclaration(),
                    ),
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
              renderers.configAdapters.render({
                variables: {
                  TPL_ADAPTERS: TsCodeUtils.mergeFragmentsAsObject(adapterMap),
                },
              }),
            );

            // Copy constants

            const categoriesMap = storageModuleConfigValues.fileCategories;

            await builder.apply(
              renderers.configCategories.render({
                variables: {
                  TPL_FILE_CATEGORIES:
                    TsCodeUtils.mergeFragmentsAsArray(categoriesMap),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
