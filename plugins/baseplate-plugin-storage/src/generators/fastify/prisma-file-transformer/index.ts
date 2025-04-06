import type { PrismaOutputRelationField } from '@halfdomelabs/fastify-generators';

import { quot, TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import {
  prismaCrudServiceSetupProvider,
  prismaOutputProvider,
  prismaUtilsProvider,
} from '@halfdomelabs/fastify-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { storageModuleProvider } from '../storage-module/index.js';

const descriptorSchema = z.object({
  name: z.string(),
  category: z.string(),
});

export const prismaFileTransformerGenerator = createGenerator({
  name: 'fastify/prisma-file-transformer',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: ({ name, category }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaCrudServiceSetup: prismaCrudServiceSetupProvider,
        storageModule: storageModuleProvider,
        prismaOutput: prismaOutputProvider,
        prismaUtils: prismaUtilsProvider,
      },
      exports: {},
      run({
        prismaOutput,
        prismaCrudServiceSetup,
        storageModule,
        prismaUtils,
      }) {
        const modelName = prismaCrudServiceSetup.getModelName();
        const model = prismaOutput.getPrismaModel(modelName);

        const foreignRelation = model.fields.find(
          (f): f is PrismaOutputRelationField =>
            f.type === 'relation' && f.name === name,
        );

        if (!foreignRelation) {
          throw new Error(
            `Could not find relation ${name} in model ${modelName}`,
          );
        }

        if (foreignRelation.fields?.length !== 1) {
          throw new Error(
            `Foreign relation for file transformer must only have one field in model ${modelName}`,
          );
        }

        const foreignRelationFieldName = foreignRelation.fields[0];

        prismaCrudServiceSetup.addTransformer(name, {
          buildTransformer: ({ operationType }) => {
            const isFieldOptional =
              operationType === 'update' || foreignRelation.isOptional;
            const transformer = TypescriptCodeUtils.createExpression(
              `await validateFileUploadInput(${name}, ${quot(category)}, context${
                operationType === 'create'
                  ? ''
                  : `, existingItem${
                      operationType === 'upsert' ? '?' : ''
                    }.${foreignRelationFieldName}`
              })`,
              'import {validateFileUploadInput} from "%storage-module/validate-upload-input";',
              { importMappers: [storageModule] },
            );

            const prefix = isFieldOptional
              ? `${name} == null ? ${name} : `
              : '';

            return {
              inputFields: [
                {
                  type: TypescriptCodeUtils.createExpression(
                    `FileUploadInput${foreignRelation.isOptional ? '| null' : ''}`,
                    'import {FileUploadInput} from "%storage-module/validate-upload-input";',
                    { importMappers: [storageModule] },
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
                        `createPrismaDisconnectOrConnectData(${name}Output?.data)`,
                        `import {createPrismaDisconnectOrConnectData} from "%prisma-utils/prismaRelations";`,
                        { importMappers: [prismaUtils] },
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
          providers: {
            prismaFileTransformer: {},
          },
        };
      },
    }),
  }),
});
