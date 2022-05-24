import path from 'path';
import {
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
import * as yup from 'yup';
import { configServiceProvider } from '@src/generators/core/config-service';
import { errorHandlerServiceProvider } from '@src/generators/core/error-handler-service';
import { appModuleProvider } from '@src/generators/core/root-module';
import { serviceContextProvider } from '@src/generators/core/service-context';
import { nexusSchemaProvider } from '@src/generators/nexus/nexus';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';

const descriptorSchema = yup.object({
  fileModel: yup.string().required(),
  s3Adapters: yup.array().of(
    yup.object({
      name: yup.string().required(),
      bucketConfigVar: yup.string().required(),
    })
  ),
  categories: yup.array().of(
    yup.object({
      name: yup.string().required(),
      defaultAdapter: yup.string().required(),
      maxFileSize: yup.number().required(),
      usedByRelation: yup.string().required(),
      uploadRoles: yup.array().of(yup.string().required()).required(),
    })
  ),
});

export type StorageModuleProvider = unknown;

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
    }
  ) {
    const moduleFolder = appModule.getModuleFolder();

    node.addPackages({
      '@aws-sdk/client-s3': '^3.86.0',
      '@aws-sdk/s3-presigned-post': '^3.86.0',
      'mime-types': '^2.1.35',
    });

    node.addDevPackages({
      '@types/mime-types': '^2.1.1',
    });

    configService
      .getConfigEntries()
      .set('AWS_ACCESS_KEY_ID', {
        comment: 'AWS access key ID',
        value: new TypescriptCodeExpression('yup.string().required()'),
        seedValue: 'AWS_ACCESS_KEY',
      })
      .set('AWS_SECRET_ACCESS_KEY', {
        comment: 'AWS secret access key',
        value: new TypescriptCodeExpression('yup.string().required()'),
        seedValue: 'AWS_SECRET_ACCSS_KEY',
      })
      .set('AWS_DEFAULT_REGION', {
        comment: 'AWS default region',
        value: new TypescriptCodeExpression('yup.string().required()'),
        seedValue: 'AWS_DEFAULT_REGION',
      });

    return {
      getProviders: () => ({
        storageModule: {},
      }),
      build: async (builder) => {
        // Copy adapters
        await builder.apply(
          typescript.createCopyFilesAction({
            destinationBaseDirectory: moduleFolder,
            paths: ['adapters/index.ts', 'adapters/s3.ts', 'adapters/types.ts'],
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
              source: file,
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
            value: new TypescriptCodeExpression('yup.string().required()'),
            seedValue: adapter.bucketConfigVar,
          });

          adapters[adapter.name] = TypescriptCodeUtils.mergeExpressionsAsObject(
            {
              bucket: `config.${adapter.bucketConfigVar}`,
              region: `config.AWS_DEFAULT_REGION`,
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
