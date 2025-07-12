import type { PrismaOutputRelationField } from '@baseplate-dev/fastify-generators';

import {
  tsCodeFragment,
  tsTemplate,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import {
  prismaCrudServiceSetupProvider,
  prismaOutputProvider,
  prismaUtilsImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { fileCategoriesProvider } from '#src/storage/core/generators/file-categories/file-categories.generator.js';

import { storageModuleImportsProvider } from '../storage-module/index.js';

const descriptorSchema = z.object({
  name: z.string(),
  category: z.string(),
  featureId: z.string(),
});

export const prismaFileTransformerGenerator = createGenerator({
  name: 'fastify/prisma-file-transformer',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: ({ name, category, featureId }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaCrudServiceSetup: prismaCrudServiceSetupProvider,
        storageModuleImports: storageModuleImportsProvider,
        prismaOutput: prismaOutputProvider,
        prismaUtilsImports: prismaUtilsImportsProvider,
        fileCategories: fileCategoriesProvider
          .dependency()
          .reference(featureId),
      },
      exports: {},
      run({
        prismaOutput,
        prismaCrudServiceSetup,
        storageModuleImports,
        prismaUtilsImports,
        fileCategories,
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
            const transformer = tsTemplateWithImports([
              storageModuleImports.validateFileInput.declaration(),
            ])`await validateFileInput(${name}, ${fileCategories.getFileCategoryImportFragment(category)}, context${
              operationType === 'create'
                ? ''
                : `, existingItem${
                    operationType === 'upsert' ? '?' : ''
                  }.${foreignRelationFieldName}`
            })`;

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
