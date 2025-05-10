import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
  tsTypeImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  appModuleProvider,
  configServiceImportsProvider,
  configServiceProvider,
  createPothosTypeReference,
  errorHandlerServiceImportsProvider,
  pothosConfigProvider,
  pothosImportsProvider,
  pothosSchemaProvider,
  pothosTypeOutputProvider,
  prismaOutputProvider,
  prismaUtilsImportsProvider,
  serviceContextImportsProvider,
} from '@halfdomelabs/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import path from 'node:path';
import { z } from 'zod';

import { STORAGE_PACKAGES } from '@src/constants';

import {
  createStorageModuleImports,
  storageModuleImportsProvider,
} from './generated/ts-import-maps';
import { FASTIFY_STORAGE_MODULE_TS_TEMPLATES } from './generated/ts-templates';

const descriptorSchema = z.object({
  /**
   * The name of the file model to use for the storage module.
   */
  fileModel: z.string().min(1),
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
  /**
   * The categories to use for the storage module.
   */
  categories: z.array(
    z.object({
      /**
       * The name of the category.
       */
      name: z.string().min(1),
      defaultAdapter: z.string().min(1),
      maxFileSize: z.number().optional(),
      usedByRelation: z.string().min(1),
      uploadRoles: z.array(z.string().min(1)),
    }),
  ),
});

export const storageModuleGenerator = createGenerator({
  name: 'fastify/storage-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ fileModel, s3Adapters, categories = [] }) => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(STORAGE_PACKAGES, [
        '@aws-sdk/client-s3',
        '@aws-sdk/s3-presigned-post',
        '@aws-sdk/s3-request-presigner',
        'mime-types',
      ]),
      dev: extractPackageVersions(STORAGE_PACKAGES, ['@types/mime-types']),
    }),
    setupFileInputSchema: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
        pothosConfig: pothosConfigProvider,
      },
      run({ pothosConfig, appModule }) {
        const moduleFolder = appModule.getModuleFolder();
        pothosConfig.inputTypes.set(
          'FileUploadInput',
          createPothosTypeReference({
            name: 'FileUploadInput',
            exportName: 'fileUploadInputInputType',
            moduleSpecifier: path.posix.join(
              moduleFolder,
              'schema/file-upload.input-type.js',
            ),
          }),
        );

        return {};
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
      },
      exports: {
        storageModuleImports: storageModuleImportsProvider.export(projectScope),
      },
      run({ appModule }) {
        const moduleFolder = appModule.getModuleFolder();
        return {
          providers: {
            storageModuleImports: createStorageModuleImports(moduleFolder),
          },
        };
      },
    }),
    config: createProviderTask(configServiceProvider, (configService) => {
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
    }),
    build: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        pothosSchema: pothosSchemaProvider,
        pothosImports: pothosImportsProvider,
        appModule: appModuleProvider,
        serviceContextImports: serviceContextImportsProvider,
        errorHandlerServiceImports: errorHandlerServiceImportsProvider,
        prismaOutput: prismaOutputProvider,
        configServiceImports: configServiceImportsProvider,
        prismaUtilsImports: prismaUtilsImportsProvider,
        fileObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(`prisma-object-type:${fileModel}`),
      },
      run({
        typescriptFile,
        appModule,
        pothosSchema,
        pothosImports,
        serviceContextImports,
        errorHandlerServiceImports,
        prismaOutput,
        configServiceImports,
        prismaUtilsImports,
        fileObjectType,
      }) {
        const moduleFolder = appModule.getModuleFolder();

        return {
          build: async (builder) => {
            // Copy adapters
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: FASTIFY_STORAGE_MODULE_TS_TEMPLATES.adaptersGroup,
                baseDirectory: path.posix.join(moduleFolder, 'adapters'),
              }),
            );

            // Copy schema
            const fileObjectRef = fileObjectType.getTypeReference();
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                onRenderTemplateFile: (canonicalPath) => {
                  appModule.moduleImports.push(canonicalPath);
                  pothosSchema.registerSchemaFile(canonicalPath);
                },
                group: FASTIFY_STORAGE_MODULE_TS_TEMPLATES.schemaGroup,
                baseDirectory: path.posix.join(moduleFolder, 'schema'),
                importMapProviders: {
                  pothosImports,
                },
                variables: {
                  schemaHostedUrlField: {
                    TPL_FILE_OBJECT_TYPE: fileObjectRef.fragment,
                  },
                  schemaPresignedMutations: {
                    TPL_FILE_OBJECT_TYPE: fileObjectRef.fragment,
                  },
                },
              }),
            );

            // Copy services
            const model = prismaOutput.getPrismaModelFragment(fileModel);
            const modelType = prismaOutput.getModelTypeFragment(fileModel);

            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: FASTIFY_STORAGE_MODULE_TS_TEMPLATES.servicesGroup,
                baseDirectory: path.posix.join(moduleFolder, 'services'),
                importMapProviders: {
                  errorHandlerServiceImports,
                  serviceContextImports,
                  prismaUtilsImports,
                },
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
                  servicesValidateUploadInput: {
                    TPL_FILE_MODEL: model,
                  },
                  servicesUploadFile: {
                    TPL_FILE_MODEL: model,
                    TPL_FILE_MODEL_TYPE: modelType,
                  },
                },
              }),
            );

            // Copy utils
            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: FASTIFY_STORAGE_MODULE_TS_TEMPLATES.utilsGroup,
                baseDirectory: path.posix.join(moduleFolder, 'utils'),
                importMapProviders: {
                  serviceContextImports,
                  errorHandlerServiceImports,
                },
                variables: {
                  utilsUpload: {
                    TPL_FILE_CREATE_INPUT: tsCodeFragment(
                      `Prisma.${fileModel}CreateInput`,
                      tsTypeImportBuilder(['Prisma']).from('@prisma/client'),
                    ),
                  },
                },
              }),
            );

            // Copy constants
            const adapterMap = new Map<string, TsCodeFragment>();

            for (const adapter of s3Adapters) {
              const adapterOptions = TsCodeUtils.mergeFragmentsAsObject({
                bucket: `config.${adapter.bucketConfigVar}`,
                region: `config.AWS_DEFAULT_REGION`,
                hostedUrl: adapter.hostedUrlConfigVar
                  ? `config.${adapter.hostedUrlConfigVar}`
                  : undefined,
              });

              adapterMap.set(
                adapter.name,
                TsCodeUtils.templateWithImports([
                  tsImportBuilder(['createS3Adapter']).from(
                    path.posix.join(moduleFolder, 'adapters/index.js'),
                  ),
                  configServiceImports.config.declaration(),
                ])`createS3Adapter(${adapterOptions})`,
              );
            }

            adapterMap.set(
              'url',
              tsCodeFragment(
                'createUrlAdapter()',
                tsImportBuilder(['createUrlAdapter']).from(
                  path.posix.join(moduleFolder, 'adapters/index.js'),
                ),
              ),
            );

            const categoriesMap = new Map<string, TsCodeFragment>();
            for (const category of categories) {
              categoriesMap.set(
                category.name,
                TsCodeUtils.mergeFragmentsAsObject({
                  name: quot(category.name),
                  authorizeUpload:
                    category.uploadRoles.length > 0
                      ? tsTemplate`({ auth }) => auth.hasSomeRole(${TsCodeUtils.mergeFragmentsAsArrayPresorted(
                          category.uploadRoles.map(quot).sort(),
                        )})`
                      : undefined,
                  defaultAdapter: quot(category.defaultAdapter),
                  maxFileSize: `${category.maxFileSize ?? 100} * MEGABYTE`,
                  usedByRelation: quot(category.usedByRelation),
                }),
              );
            }

            await builder.apply(
              typescriptFile.renderTemplateGroup({
                group: FASTIFY_STORAGE_MODULE_TS_TEMPLATES.constantsGroup,
                baseDirectory: path.posix.join(moduleFolder, 'constants'),
                importMapProviders: {
                  serviceContextImports,
                },
                variables: {
                  constantsAdapters: {
                    TPL_ADAPTERS:
                      TsCodeUtils.mergeFragmentsAsObject(adapterMap),
                  },
                  constantsFileCategories: {
                    TPL_FILE_CATEGORIES:
                      TsCodeUtils.mergeFragmentsAsArray(categoriesMap),
                    TPL_FILE_COUNT_OUTPUT_TYPE: tsCodeFragment(
                      `Prisma.${fileModel}CountOutputType`,
                      tsTypeImportBuilder(['Prisma']).from('@prisma/client'),
                    ),
                    TPL_FILE_MODEL_TYPE: modelType,
                  },
                },
              }),
            );
          },
        };
      },
    }),
  }),
});

export { storageModuleImportsProvider } from './generated/ts-import-maps';
