import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  nodeProvider,
  projectScope,
  quot,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptStringReplacement,
} from '@halfdomelabs/core-generators';
import {
  appModuleProvider,
  configServiceProvider,
  errorHandlerServiceProvider,
  pothosSchemaProvider,
  pothosSetupProvider,
  pothosTypeOutputProvider,
  prismaOutputProvider,
  prismaUtilsProvider,
  serviceContextProvider,
} from '@halfdomelabs/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import { STORAGE_PACKAGES } from '@src/constants';

const descriptorSchema = z.object({
  fileModel: z.string().min(1),
  s3Adapters: z.array(
    z.object({
      name: z.string().min(1),
      bucketConfigVar: z.string().min(1),
      hostedUrlConfigVar: z.string().optional(),
    }),
  ),
  categories: z.array(
    z.object({
      name: z.string().min(1),
      defaultAdapter: z.string().min(1),
      maxFileSize: z.number().optional(),
      usedByRelation: z.string().min(1),
      uploadRoles: z.array(z.string().min(1)),
    }),
  ),
});

type StorageModuleProvider = ImportMapper;

export const storageModuleProvider = createProviderType<StorageModuleProvider>(
  'storage-module',
  { isReadOnly: true },
);

export const storageModuleGenerator = createGenerator({
  name: 'fastify/storage-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ fileModel, s3Adapters, categories = [] }) => [
    createGeneratorTask({
      name: 'setup-file-input-schema',
      dependencies: {
        appModule: appModuleProvider,
        pothosSetup: pothosSetupProvider,
      },
      run({ pothosSetup, appModule }) {
        const moduleFolder = appModule.getModuleFolder();
        pothosSetup.getTypeReferences().addInputType({
          typeName: 'FileUploadInput',
          exportName: 'fileUploadInputInputType',
          moduleName: `@/${path.posix.join(
            moduleFolder,
            'schema/file-upload.input-type.js',
          )}`,
        });

        return {};
      },
    }),
    createGeneratorTask({
      name: 'main',
      dependencies: {
        appModule: appModuleProvider,
      },
      exports: { storageModule: storageModuleProvider.export(projectScope) },
      run({ appModule }) {
        const moduleFolder = appModule.getModuleFolder();
        const [validatorImport] = makeImportAndFilePath(
          `${moduleFolder}/services/validate-upload-input.ts`,
        );
        const [adaptersImport] = makeImportAndFilePath(
          `${moduleFolder}/constants/adapters.ts`,
        );

        return {
          providers: {
            storageModule: {
              getImportMap() {
                return {
                  '%storage-module/validate-upload-input': {
                    path: validatorImport,
                    allowedImports: [
                      'FileUploadInput',
                      'validateFileUploadInput',
                    ],
                  },
                  '%storage-module/adapter-constants': {
                    path: adaptersImport,
                    allowedImports: ['STORAGE_ADAPTERS', 'StorageAdapterKey'],
                  },
                };
              },
            },
          },
        };
      },
    }),
    createGeneratorTask({
      name: 'build',
      dependencies: {
        node: nodeProvider,
        typescript: typescriptProvider,
        pothosSchema: pothosSchemaProvider,
        appModule: appModuleProvider,
        serviceContext: serviceContextProvider,
        errorHandlerService: errorHandlerServiceProvider,
        prismaOutput: prismaOutputProvider,
        configService: configServiceProvider,
        prismaUtils: prismaUtilsProvider,
        fileObjectType: pothosTypeOutputProvider
          .dependency()
          .reference(`prisma-object-type:${fileModel}`),
      },
      run({
        node,
        typescript,
        appModule,
        pothosSchema,
        serviceContext,
        errorHandlerService,
        prismaOutput,
        configService,
        prismaUtils,
        fileObjectType,
      }) {
        const moduleFolder = appModule.getModuleFolder();
        const [, validatorPath] = makeImportAndFilePath(
          `${moduleFolder}/services/validate-upload-input.ts`,
        );

        node.addPackages({
          '@aws-sdk/client-s3': STORAGE_PACKAGES['@aws-sdk/client-s3'],
          '@aws-sdk/s3-presigned-post':
            STORAGE_PACKAGES['@aws-sdk/s3-presigned-post'],
          '@aws-sdk/s3-request-presigner':
            STORAGE_PACKAGES['@aws-sdk/s3-request-presigner'],
          'mime-types': STORAGE_PACKAGES['mime-types'],
        });

        node.addDevPackages({
          '@types/mime-types': STORAGE_PACKAGES['@types/mime-types'],
        });

        configService
          .getConfigEntries()
          .set('AWS_ACCESS_KEY_ID', {
            comment: 'AWS access key ID',
            value: new TypescriptCodeExpression('z.string().min(1)'),
            seedValue: 'AWS_ACCESS_KEY',
          })
          .set('AWS_SECRET_ACCESS_KEY', {
            comment: 'AWS secret access key',
            value: new TypescriptCodeExpression('z.string().min(1)'),
            seedValue: 'AWS_SECRET_ACCSS_KEY',
          })
          .set('AWS_DEFAULT_REGION', {
            comment: 'AWS default region',
            value: new TypescriptCodeExpression('z.string().min(1)'),
            seedValue: 'AWS_DEFAULT_REGION',
          });

        return {
          build: async (builder) => {
            // Copy adapters
            await builder.apply(
              typescript.createCopyFilesAction({
                destinationBaseDirectory: moduleFolder,
                paths: [
                  'adapters/index.ts',
                  'adapters/s3.ts',
                  'adapters/url.ts',
                  'adapters/types.ts',
                ],
              }),
            );
            // Copy schema
            async function registerSchemaFile(file: string): Promise<void> {
              appModule.addModuleImport(`@/${moduleFolder}/${file}.js`);
              pothosSchema.registerSchemaFile(
                path.join(moduleFolder, `${file}.ts`),
              );

              const fileObjectRef = fileObjectType.getTypeReference();
              await builder.apply(
                typescript.createCopyAction({
                  source: `${file}.ts`,
                  destination: path.join(moduleFolder, `${file}.ts`),
                  importMappers: [pothosSchema],
                  replacements: {
                    FILE_OBJECT_MODULE: fileObjectRef.moduleName,
                    FILE_OBJECT_TYPE: fileObjectRef.exportName,
                  },
                }),
              );
            }

            await Promise.all([
              registerSchemaFile('schema/file-upload.input-type'),
              registerSchemaFile('schema/hosted-url.field'),
              registerSchemaFile('schema/presigned.mutations'),
            ]);

            // Copy services
            const model = prismaOutput.getPrismaModelExpression(fileModel);
            const modelType = prismaOutput.getModelTypeExpression(fileModel);
            const createPresignedUploadUrlFile = typescript.createTemplate(
              { FILE_MODEL: model, FILE_MODEL_TYPE: modelType },
              { importMappers: [errorHandlerService, serviceContext] },
            );
            await builder.apply(
              createPresignedUploadUrlFile.renderToAction(
                'services/create-presigned-upload-url.ts',
                path.join(
                  moduleFolder,
                  'services/create-presigned-upload-url.ts',
                ),
              ),
            );

            const createPresignedDownloadUrlFile = typescript.createTemplate(
              { FILE_MODEL: model },
              { importMappers: [errorHandlerService, serviceContext] },
            );
            await builder.apply(
              createPresignedDownloadUrlFile.renderToAction(
                'services/create-presigned-download-url.ts',
                path.join(
                  moduleFolder,
                  'services/create-presigned-download-url.ts',
                ),
              ),
            );

            const downloadFile = typescript.createTemplate(
              { FILE_MODEL: model, FILE_MODEL_TYPE: modelType },
              { importMappers: [errorHandlerService, serviceContext] },
            );
            await builder.apply(
              downloadFile.renderToAction(
                'services/download-file.ts',
                path.join(moduleFolder, 'services/download-file.ts'),
              ),
            );

            const validateUploadInputFile = typescript.createTemplate(
              { FILE_MODEL: model },
              {
                importMappers: [
                  prismaUtils,
                  errorHandlerService,
                  serviceContext,
                ],
              },
            );
            await builder.apply(
              validateUploadInputFile.renderToAction(
                'services/validate-upload-input.ts',
                validatorPath,
              ),
            );

            // Copy utils
            await builder.apply(
              typescript.createCopyFilesAction({
                destinationBaseDirectory: moduleFolder,
                paths: [
                  'utils/mime.ts',
                  'utils/mime.unit.test.ts',
                  {
                    path: 'utils/upload.ts',
                    replacements: {
                      FILE_CREATE_INPUT: `${fileModel}CreateInput`,
                    },
                  },
                ],
                importMappers: [serviceContext, errorHandlerService],
              }),
            );

            // Copy constants
            const adapters: Record<string, TypescriptCodeExpression> = {};

            for (const adapter of s3Adapters) {
              configService.getConfigEntries().set(adapter.bucketConfigVar, {
                comment: `S3 bucket for ${adapter.name}`,
                value: new TypescriptCodeExpression('z.string().min(1)'),
                seedValue: adapter.bucketConfigVar,
              });

              if (adapter.hostedUrlConfigVar) {
                configService
                  .getConfigEntries()
                  .set(adapter.hostedUrlConfigVar, {
                    comment: `Hosted URL prefix for ${adapter.name}, e.g. https://uploads.example.com`,
                    value: new TypescriptCodeExpression('z.string().min(1)'),
                    seedValue: adapter.hostedUrlConfigVar,
                  });
              }

              adapters[adapter.name] =
                TypescriptCodeUtils.mergeExpressionsAsObject({
                  bucket: `config.${adapter.bucketConfigVar}`,
                  region: `config.AWS_DEFAULT_REGION`,
                  hostedUrl: adapter.hostedUrlConfigVar
                    ? `config.${adapter.hostedUrlConfigVar}`
                    : undefined,
                }).wrap(
                  (contents) => `createS3Adapter(${contents})`,
                  [
                    `import { createS3Adapter } from '../adapters/index.js';`,
                    `import { config } from '%config';`,
                  ],
                );
            }

            const adaptersFile = typescript.createTemplate(
              {
                ADAPTERS:
                  TypescriptCodeUtils.mergeExpressionsAsObject(adapters),
              },
              {
                importMappers: [configService],
              },
            );
            await builder.apply(
              adaptersFile.renderToAction(
                'constants/adapters.ts',
                path.join(moduleFolder, 'constants/adapters.ts'),
              ),
            );

            const categoriesList: TypescriptCodeExpression[] = categories.map(
              (category) =>
                TypescriptCodeUtils.mergeExpressionsAsObject({
                  name: quot(category.name),
                  authorizeUpload:
                    category.uploadRoles.length > 0
                      ? TypescriptCodeUtils.mergeExpressionsAsArray(
                          category.uploadRoles.map(quot),
                        ).wrap(
                          (contents) =>
                            `({ auth }) => auth.hasSomeRole(${contents})`,
                        )
                      : undefined,
                  defaultAdapter: quot(category.defaultAdapter),
                  maxFileSize: `${category.maxFileSize ?? 100} * MEGABYTE`,
                  usedByRelation: quot(category.usedByRelation),
                }),
            );

            const categoriesFile = typescript.createTemplate(
              {
                CATEGORIES:
                  TypescriptCodeUtils.mergeExpressionsAsArray(categoriesList),
                FILE_COUNT_OUTPUT_TYPE: new TypescriptStringReplacement(
                  `${fileModel}CountOutputType`,
                ),
                FILE_MODEL_TYPE: modelType,
              },
              { importMappers: [serviceContext] },
            );
            await builder.apply(
              categoriesFile.renderToAction(
                'constants/file-categories.ts',
                path.join(moduleFolder, 'constants/file-categories.ts'),
              ),
            );

            adapters.url = TypescriptCodeUtils.createExpression(
              'createUrlAdapter()',
              `import { createS3Adapter } from '../adapters/index.js';`,
            );
          },
        };
      },
    }),
  ],
});
