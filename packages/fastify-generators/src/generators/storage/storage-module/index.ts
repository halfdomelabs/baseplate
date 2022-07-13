import path from 'path';
import {
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
  quot,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptStringReplacement,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import { z } from 'zod';
import { configServiceProvider } from '@src/generators/core/config-service';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { appModuleProvider } from '@src/generators/core/root-module';
import { serviceContextProvider } from '@src/generators/core/service-context';
import { nexusSchemaProvider } from '@src/generators/nexus/nexus';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { prismaUtilsProvider } from '@src/generators/prisma/prisma-utils';

const descriptorSchema = z.object({
  fileModel: z.string().min(1),
  s3Adapters: z.array(
    z.object({
      name: z.string().min(1),
      bucketConfigVar: z.string().min(1),
      hostedUrlConfigVar: z.string().optional(),
    })
  ),
  categories: z.array(
    z.object({
      name: z.string().min(1),
      defaultAdapter: z.string().min(1),
      maxFileSize: z.number(),
      usedByRelation: z.string().min(1),
      uploadRoles: z.array(z.string().min(1)),
    })
  ),
});

export type StorageModuleProvider = ImportMapper;

export const storageModuleProvider =
  createProviderType<StorageModuleProvider>('storage-module');

const StorageModuleGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
    nexusSchema: nexusSchemaProvider,
    appModule: appModuleProvider,
    serviceContext: serviceContextProvider,
    errorHandlerService: errorHandlerServiceProvider,
    prismaOutput: prismaOutputProvider,
    configService: configServiceProvider,
    prismaUtils: prismaUtilsProvider,
  },
  exports: {
    storageModule: storageModuleProvider,
  },
  createGenerator(
    { fileModel, s3Adapters, categories = [] },
    {
      node,
      typescript,
      appModule,
      nexusSchema,
      serviceContext,
      errorHandlerService,
      prismaOutput,
      configService,
      prismaUtils,
    }
  ) {
    const moduleFolder = appModule.getModuleFolder();

    node.addPackages({
      '@aws-sdk/client-s3': '3.121.0',
      '@aws-sdk/s3-presigned-post': '3.121.0',
      'mime-types': '2.1.35',
    });

    node.addDevPackages({
      '@types/mime-types': '2.1.1',
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

    const [validatorImport, validatorPath] = makeImportAndFilePath(
      `${moduleFolder}/services/validate-upload-input.ts`
    );

    return {
      getProviders: () => ({
        storageModule: {
          getImportMap() {
            return {
              '%storage-module/validate-upload-input': {
                path: validatorImport,
                allowedImports: ['FileUploadInput', 'validateFileUploadInput'],
              },
            };
          },
        },
      }),
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
          })
        );
        // Copy schema
        async function registerSchemaFile(
          name: string,
          file: string
        ): Promise<void> {
          appModule.registerFieldEntry(
            'schemaTypes',
            new TypescriptCodeExpression(
              name,
              `import * as ${name} from '@/${moduleFolder}/${file}'`
            )
          );
          nexusSchema.registerSchemaFile(
            path.join(moduleFolder, `schema/${file}.ts`)
          );

          await builder.apply(
            typescript.createCopyAction({
              source: `${file}.ts`,
              destination: path.join(moduleFolder, `${file}.ts`),
              importMappers: [nexusSchema],
            })
          );
        }

        await Promise.all([
          registerSchemaFile('fileUploadInput', 'schema/file-upload-input'),
          registerSchemaFile(
            'presignedMutations',
            'schema/presigned-mutations'
          ),
        ]);

        // Copy services
        const model = prismaOutput.getPrismaModelExpression(fileModel);
        const modelType = prismaOutput.getModelTypeExpression(fileModel);
        const createPresignedUploadUrlFile = typescript.createTemplate(
          { FILE_MODEL: model, FILE_MODEL_TYPE: modelType },
          {
            importMappers: [errorHandlerService, serviceContext],
          }
        );
        await builder.apply(
          createPresignedUploadUrlFile.renderToAction(
            'services/create-presigned-upload-url.ts',
            path.join(moduleFolder, 'services/create-presigned-upload-url.ts')
          )
        );

        const validateUploadInputFile = typescript.createTemplate(
          { FILE_MODEL: model },
          {
            importMappers: [prismaUtils, errorHandlerService, serviceContext],
          }
        );
        await builder.apply(
          validateUploadInputFile.renderToAction(
            'services/validate-upload-input.ts',
            validatorPath
          )
        );

        // Copy utils
        await builder.apply(
          typescript.createCopyFilesAction({
            destinationBaseDirectory: moduleFolder,
            paths: ['utils/mime.ts', 'utils/mime.unit.test.ts'],
          })
        );

        // Copy constants
        const adapters: Record<string, TypescriptCodeExpression> = {};

        s3Adapters?.forEach((adapter) => {
          configService.getConfigEntries().set(adapter.bucketConfigVar, {
            comment: `S3 bucket for ${adapter.name}`,
            value: new TypescriptCodeExpression('z.string().min(1)'),
            seedValue: adapter.bucketConfigVar,
          });

          if (adapter.hostedUrlConfigVar) {
            configService.getConfigEntries().set(adapter.hostedUrlConfigVar, {
              comment: `Hosted URL prefix for ${adapter.name}, e.g. https://uploads.example.com`,
              value: new TypescriptCodeExpression('z.string().min(1)'),
              seedValue: adapter.hostedUrlConfigVar,
            });
          }

          adapters[adapter.name] = TypescriptCodeUtils.mergeExpressionsAsObject(
            {
              bucket: `config.${adapter.bucketConfigVar}`,
              region: `config.AWS_DEFAULT_REGION`,
              hostedUrl: adapter.hostedUrlConfigVar
                ? `config.${adapter.hostedUrlConfigVar}`
                : undefined,
            }
          ).wrap(
            (contents) => `createS3Adapter(${contents})`,
            [
              `import { createS3Adapter } from '../adapters';`,
              `import { config } from '%config';`,
            ]
          );
        });

        const adaptersFile = typescript.createTemplate(
          {
            ADAPTERS: TypescriptCodeUtils.mergeExpressionsAsObject(adapters),
          },
          {
            importMappers: [configService],
          }
        );
        await builder.apply(
          adaptersFile.renderToAction(
            'constants/adapters.ts',
            path.join(moduleFolder, 'constants/adapters.ts')
          )
        );

        const categoriesList: TypescriptCodeExpression[] = categories.map(
          (category) =>
            TypescriptCodeUtils.mergeExpressionsAsObject({
              name: quot(category.name),
              authorizeUpload: category.uploadRoles?.length
                ? TypescriptCodeUtils.mergeExpressionsAsArray(
                    category.uploadRoles.map(quot)
                  ).wrap(
                    (contents) => `({ auth }) => auth.hasSomeRole(${contents})`
                  )
                : undefined,
              defaultAdapter: quot(category.defaultAdapter),
              maxFileSize: `${category.maxFileSize} * MEGABYTE`,
              usedByRelation: quot(category.usedByRelation),
            })
        );

        const categoriesFile = typescript.createTemplate(
          {
            CATEGORIES:
              TypescriptCodeUtils.mergeExpressionsAsArray(categoriesList),
            FILE_COUNT_OUTPUT_TYPE: new TypescriptStringReplacement(
              `${fileModel}CountOutputType`
            ),
          },
          { importMappers: [serviceContext] }
        );
        await builder.apply(
          categoriesFile.renderToAction(
            'constants/file-categories.ts',
            path.join(moduleFolder, 'constants/file-categories.ts')
          )
        );

        // awkward AWS hack (https://stackoverflow.com/questions/66275648/aws-javascript-sdk-v3-typescript-doesnt-compile-due-to-error-ts2304-cannot-f/66275649#66275649)
        await builder.apply(
          typescript.createCopyAction({
            source: '@types/dom.ts',
            destination: 'src/@types/dom.ts',
          })
        );
      },
    };
  },
});

export default StorageModuleGenerator;
