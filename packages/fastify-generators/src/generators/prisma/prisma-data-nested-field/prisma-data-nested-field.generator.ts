import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { prismaGeneratedImportsProvider } from '../_providers/prisma-generated-imports.js';
import { generateScalarInputField } from '../_shared/field-definition-generators/generate-scalar-input-field.js';
import { dataUtilsImportsProvider } from '../data-utils/index.js';
import {
  prismaDataServiceProvider,
  prismaDataServiceSetupProvider,
} from '../prisma-data-service/prisma-data-service.generator.js';
import { prismaOutputProvider } from '../prisma/prisma.generator.js';
import { writePrismaDataNestedField } from './nested-field-writer.js';

const descriptorSchema = z.object({
  /** Name of the model */
  modelName: z.string().min(1),
  /** Name of the relation */
  relationName: z.string().min(1),
  /** Name of the nested model */
  nestedModelName: z.string().min(1),
  /** Fields on the nested model to use */
  fieldNames: z.array(z.string().min(1)).min(1),
});

/**
 * Generator for prisma/prisma-data-nested-field
 */
export const prismaDataNestedFieldGenerator = createGenerator({
  name: 'prisma/prisma-data-nested-field',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.relationName,
  buildTasks: ({ modelName, relationName, nestedModelName, fieldNames }) => ({
    nestedPrismaDataServiceSetup: createGeneratorTask({
      dependencies: {
        prismaDataServiceSetup: prismaDataServiceSetupProvider
          .dependency()
          .optionalReference(nestedModelName),
      },
      run({ prismaDataServiceSetup }) {
        return {
          build: () => {
            // Make sure that if we have a nested data service, we add the field names to the service.
            prismaDataServiceSetup?.additionalModelFieldNames.push(
              ...fieldNames,
            );
          },
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        prismaDataServiceSetup: prismaDataServiceSetupProvider,
        nestedPrismaDataService: prismaDataServiceProvider
          .dependency()
          .optionalReference(nestedModelName),
        dataUtilsImports: dataUtilsImportsProvider,
        prismaGeneratedImports: prismaGeneratedImportsProvider,
      },
      run({
        prismaOutput,
        prismaDataServiceSetup,
        nestedPrismaDataService,
        dataUtilsImports,
        prismaGeneratedImports,
      }) {
        const parentModel = prismaOutput.getPrismaModel(modelName);
        const nestedModel = prismaOutput.getPrismaModel(nestedModelName);
        const relation = parentModel.fields.find(
          (f) => f.name === relationName,
        );

        if (relation?.type !== 'relation') {
          throw new Error(
            `Relation ${relationName} not found on model ${modelName}`,
          );
        }

        if (relation.modelType !== nestedModelName) {
          throw new Error(
            `Expected relation ${relationName} on model ${modelName} to reference ${nestedModelName}. Got ${relation.modelType}`,
          );
        }

        const dataServiceFields = nestedPrismaDataService?.getFields();
        const nestedFields = (() => {
          if (dataServiceFields) {
            return fieldNames.map((name) => {
              const field = dataServiceFields.find((f) => f.name === name);
              if (!field) {
                throw new Error(`Field ${name} not found in data service`);
              }
              return field;
            });
          }
          const modelFields = fieldNames.map((name) => {
            const field = nestedModel.fields.find((f) => f.name === name);
            if (!field) {
              throw new Error(`Field ${name} not found in model ${modelName}`);
            }
            if (field.type !== 'scalar') {
              throw new Error(
                `Only scalar fields are supported if no data service is provided`,
              );
            }
            return field;
          });

          return modelFields.map((field) =>
            generateScalarInputField({
              fieldName: field.name,
              scalarField: field,
              dataUtilsImports,
              prismaGeneratedImports,
              lookupEnum: (name) => prismaOutput.getServiceEnum(name),
            }),
          );
        })();

        const dataServiceFieldsFragment =
          nestedPrismaDataService?.getFieldsFragment();

        return {
          build: () => {
            prismaDataServiceSetup.virtualInputFields.add(
              writePrismaDataNestedField({
                parentModel,
                nestedModel,
                relation,
                dataServiceFieldsFragment,
                nestedFields,
                dataUtilsImports,
              }),
            );
          },
        };
      },
    }),
  }),
});
