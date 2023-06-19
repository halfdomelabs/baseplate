import { quot, TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import { prismaCrudServiceSetupProvider } from '@src/generators/prisma/prisma-crud-service/index.js';
import { prismaUtilsProvider } from '@src/generators/prisma/prisma-utils/index.js';
import { PrismaOutputRelationField } from '@src/types/prismaOutput.js';
import { storageModuleProvider } from '../storage-module/index.js';

const descriptorSchema = z.object({
  name: z.string(),
  category: z.string(),
});

export type PrismaFileTransformerProvider = unknown;

export const prismaFileTransformerProvider =
  createProviderType<PrismaFileTransformerProvider>('prisma-file-transformer');

const PrismaFileTransformerGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaCrudServiceSetup: prismaCrudServiceSetupProvider,
    storageModule: storageModuleProvider,
    prismaOutput: prismaOutputProvider,
    prismaUtils: prismaUtilsProvider,
  },
  exports: {
    prismaFileTransformer: prismaFileTransformerProvider,
  },
  createGenerator(
    { name, category },
    { prismaOutput, prismaCrudServiceSetup, storageModule, prismaUtils }
  ) {
    const modelName = prismaCrudServiceSetup.getModelName();
    const model = prismaOutput.getPrismaModel(modelName);

    const foreignRelation = model.fields.find(
      (f): f is PrismaOutputRelationField =>
        f.type === 'relation' && f.name === name
    );

    if (!foreignRelation) {
      throw new Error(`Could not find relation ${name} in model ${modelName}`);
    }

    if (foreignRelation.fields?.length !== 1) {
      throw new Error(
        `Foreign relation for file transformer must only have one field in model ${modelName}`
      );
    }

    const foreignRelationFieldName = foreignRelation.fields[0];

    prismaCrudServiceSetup.addTransformer(name, {
      buildTransformer: ({ operationType }) => {
        const isFieldOptional =
          operationType === 'update' || foreignRelation.isOptional;
        const transformer = TypescriptCodeUtils.createExpression(
          `await validateFileUploadInput(${name}, ${quot(category)}, context${
            operationType !== 'create'
              ? `, existingItem${
                  operationType === 'upsert' ? '?' : ''
                }.${foreignRelationFieldName}`
              : ''
          })`,
          'import {validateFileUploadInput} from "%storage-module/validate-upload-input";',
          { importMappers: [storageModule] }
        );

        const prefix = isFieldOptional ? `${name} == null ? ${name} : ` : '';

        return {
          inputFields: [
            {
              type: TypescriptCodeUtils.createExpression(
                `FileUploadInput${foreignRelation.isOptional ? '| null' : ''}`,
                'import {FileUploadInput} from "%storage-module/validate-upload-input";',
                { importMappers: [storageModule] }
              ),
              dtoField: {
                name,
                type: 'nested',
                isOptional: isFieldOptional,
                isNullable: foreignRelation.isOptional,
                schemaFieldName: 'FileUploadInput',
                nestedType: {
                  name: 'FileUploadInput',
                  fields: [
                    { type: 'scalar', scalarType: 'string', name: 'id' },
                  ],
                },
              },
            },
          ],
          outputFields: [
            {
              name,
              transformer: transformer
                .prepend(`const ${name}Output = ${prefix}`)
                .toBlock(),
              pipeOutputName: `${name}Output`,
              createExpression: isFieldOptional
                ? `${name}Output?.data`
                : undefined,
              updateExpression: foreignRelation.isOptional
                ? TypescriptCodeUtils.createExpression(
                    `createPrismaDisconnectOrConnectData(${name}Output && ${name}Output.data)`,
                    `import {createPrismaDisconnectOrConnectData} from "%prisma-utils/prismaRelations";`,
                    { importMappers: [prismaUtils] }
                  )
                : `${name}Output?.data`,
            },
          ],
          isAsync: true,
          needsExistingItem: true,
          needsContext: true,
        };
      },
    });
    return {
      getProviders: () => ({
        prismaFileTransformer: {},
      }),
      build: async () => {},
    };
  },
});

export default PrismaFileTransformerGenerator;
