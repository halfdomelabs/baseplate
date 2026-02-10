import type {
  PrismaOutputRelationField,
  ServiceOutputDtoNestedField,
} from '@baseplate-dev/fastify-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import {
  prismaDataServiceSetupProvider,
  prismaOutputProvider,
} from '@baseplate-dev/fastify-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { fileCategoriesProvider } from '#src/storage/core/generators/file-categories/file-categories.generator.js';

import { storageModuleImportsProvider } from '../storage-module/index.js';

const descriptorSchema = z.object({
  /** Name of the parent model */
  modelName: z.string().min(1),
  /** Name of the file relation */
  relationName: z.string().min(1),
  /** File category name */
  category: z.string().min(1),
  /** Feature ID for file categories lookup */
  featureId: z.string().min(1),
});

/**
 * Generator for fastify/file-data-field
 *
 * Creates a virtual input field for file uploads in data services.
 * This replaces the old transformer-based approach with a field-based approach
 * that integrates with the new data operations system.
 */
export const fileDataFieldGenerator = createGenerator({
  name: 'fastify/file-data-field',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.relationName,
  buildTasks: ({ modelName, relationName, category, featureId }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        storageModuleImports: storageModuleImportsProvider,
        prismaDataServiceSetup: prismaDataServiceSetupProvider,
        fileCategories: fileCategoriesProvider
          .dependency()
          .reference(featureId),
      },
      exports: {},
      run({
        prismaOutput,
        storageModuleImports,
        prismaDataServiceSetup,
        fileCategories,
      }) {
        const model = prismaOutput.getPrismaModel(modelName);

        // Find the file relation
        const relation = model.fields.find(
          (f): f is PrismaOutputRelationField =>
            f.type === 'relation' && f.name === relationName,
        );

        if (!relation) {
          throw new Error(
            `Could not find relation ${relationName} in model ${modelName}`,
          );
        }

        // Validate this is a file relation (should have exactly one field)
        if (relation.fields?.length !== 1) {
          throw new Error(
            `File relation ${relationName} in model ${modelName} must have exactly one field (the file ID field)`,
          );
        }

        const fileIdFieldName = relation.fields[0];

        // Get the file category fragment
        const fileCategoryFragment =
          fileCategories.getFileCategoryImportFragment(category);

        // Create the field configuration object
        const fieldConfig = TsCodeUtils.mergeFragmentsAsObject({
          category: fileCategoryFragment,
          fileIdFieldName: quot(fileIdFieldName),
          optional: relation.isOptional ? 'true' : undefined,
        });

        // Create the field fragment using storageModuleImports.fileField
        const fieldFragment = tsTemplate`${storageModuleImports.fileField.fragment()}(${fieldConfig})`;

        // Create the DTO field for FileUploadInput
        const outputDtoField = {
          name: relationName,
          type: 'nested',
          isPrismaType: false,
          isOptional: relation.isOptional,
          isNullable: relation.isOptional,
          nestedType: {
            name: 'FileUploadInput',
            fields: [
              {
                type: 'scalar',
                scalarType: 'string',
                name: 'id',
              },
            ],
          },
          schemaFieldName: 'FileUploadInput',
        } satisfies ServiceOutputDtoNestedField;

        return {
          build: () => {
            // Add the file field to virtual input fields
            prismaDataServiceSetup.virtualInputFields.add({
              name: relationName,
              fragment: fieldFragment,
              outputDtoField,
            });
          },
        };
      },
    }),
  }),
});
