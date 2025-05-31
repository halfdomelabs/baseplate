import type { PrismaOutputRelationField } from '@baseplate-dev/fastify-generators';

import { tsCodeFragment, tsTemplate } from '@baseplate-dev/core-generators';
import {
  prismaCrudServiceSetupProvider,
  prismaOutputProvider,
  prismaUtilsImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { storageModuleImportsProvider } from '../storage-module/storage-module.generator.js';

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
        storageModuleImports: storageModuleImportsProvider,
        prismaOutput: prismaOutputProvider,
        prismaUtilsImports: prismaUtilsImportsProvider,
      },
      exports: {},
      run({
        prismaOutput,
        prismaCrudServiceSetup,
        storageModuleImports,
        prismaUtilsImports,
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
            const transformer = tsCodeFragment(
              `await validateFileUploadInput(${name}, ${quot(category)}, context${
                operationType === 'create'
                  ? ''
                  : `, existingItem${
                      operationType === 'upsert' ? '?' : ''
                    }.${foreignRelationFieldName}`
              })`,
              storageModuleImports.validateFileUploadInput.declaration(),
            );

            const prefix = isFieldOptional
              ? `${name} == null ? ${name} : `
              : '';

            return {
              inputFields: [
                {
                  type: tsCodeFragment(
                    `FileUploadInput${foreignRelation.isOptional ? '| null' : ''}`,
                    storageModuleImports.FileUploadInput.typeDeclaration(),
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
                  transformer: tsTemplate`const ${name}Output = ${prefix}${transformer}`,
                  pipeOutputName: `${name}Output`,
                  createExpression: isFieldOptional
                    ? `${name}Output?.data`
                    : undefined,
                  updateExpression: foreignRelation.isOptional
                    ? tsCodeFragment(
                        `createPrismaDisconnectOrConnectData(${name}Output?.data)`,
                        prismaUtilsImports.createPrismaDisconnectOrConnectData.declaration(),
                      )
                    : `${name}Output${operationType === 'upsert' ? '' : '?'}.data`,
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
