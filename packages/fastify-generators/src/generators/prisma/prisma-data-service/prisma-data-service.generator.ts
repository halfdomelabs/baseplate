import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import {
  createConfigProviderTaskWithInfo,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { NamedArrayFieldContainer } from '@baseplate-dev/utils';
import { z } from 'zod';

import type { ServiceOutputMethod } from '#src/types/service-output.js';

import { serviceFileProvider } from '#src/generators/core/index.js';

import { prismaGeneratedImportsProvider } from '../_providers/prisma-generated-imports.js';
import { generateScalarField } from '../_shared/field-definition-generators/generate-scalar-field.js';
import { dataUtilsImportsProvider } from '../data-utils/index.js';
import { prismaOutputProvider } from '../prisma/prisma.generator.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  modelFieldNames: z.array(z.string()),
});

export interface ExtendedInputFieldConfig {
  name: string;
  value: TsCodeFragment;
}

const [
  createPrismaDataServiceTask,
  prismaDataServiceSetupProvider,
  prismaDataServiceValuesProvider,
] = createConfigProviderTaskWithInfo(
  (t) => ({
    extendedInputFields: t.namedArray<ExtendedInputFieldConfig>([]),
  }),
  {
    prefix: 'prisma-data-service',
    infoFromDescriptor: (descriptor) => ({
      modelName: descriptor.modelName,
    }),
  },
);

export { prismaDataServiceSetupProvider };

interface PrismaDataServiceMethod {
  name: string;
  type: 'create' | 'update' | 'delete';
  fragment: TsCodeFragment;
  outputMethod: ServiceOutputMethod;
}

export interface PrismaDataServiceProvider {
  getFieldNames(): string[];
  registerMethod(method: PrismaDataServiceMethod): void;
}

export const prismaDataServiceProvider =
  createProviderType<PrismaDataServiceProvider>('prisma-data-service');

const TYPE_TO_ORDER: Record<PrismaDataServiceMethod['type'], number> = {
  create: 1,
  update: 2,
  delete: 3,
};

/**
 * Generator for prisma/prisma-data-service
 */
export const prismaDataServiceGenerator = createGenerator({
  name: 'prisma/prisma-data-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ modelName, modelFieldNames }) => ({
    config: createPrismaDataServiceTask({ modelName }),
    main: createGeneratorTask({
      dependencies: {
        configValues: prismaDataServiceValuesProvider,
        prismaOutput: prismaOutputProvider,
        serviceFile: serviceFileProvider,
        dataUtilsImports: dataUtilsImportsProvider,
        prismaGeneratedImports: prismaGeneratedImportsProvider,
      },
      exports: {
        prismaDataService: prismaDataServiceProvider.export(),
      },
      run({
        configValues,
        prismaOutput,
        serviceFile,
        dataUtilsImports,
        prismaGeneratedImports,
      }) {
        const model = prismaOutput.getPrismaModel(modelName);
        const modelFields = modelFieldNames.map((fieldName) => {
          const field = model.fields.find((field) => field.name === fieldName);
          if (!field) {
            throw new Error(
              `Field ${fieldName} not found in model ${modelName}`,
            );
          }
          if (field.type !== 'scalar') {
            throw new Error(
              `Field ${fieldName} is not a scalar field in model ${modelName}`,
            );
          }
          return field;
        });
        const { extendedInputFields } = configValues;
        const fieldNames = [
          ...modelFields.map((field) => field.name),
          ...extendedInputFields.map((field) => field.name),
        ];

        const methods = new NamedArrayFieldContainer<PrismaDataServiceMethod>();

        // Check if modelFields and additionalFields overlap
        const overlappingFields = modelFields.filter((field) =>
          extendedInputFields.some(
            (extendedField) => extendedField.name === field.name,
          ),
        );
        if (overlappingFields.length > 0) {
          throw new Error(
            `Fields ${overlappingFields.map((field) => field.name).join(', ')} overlap with model fields`,
          );
        }

        const inputFieldsObject = TsCodeUtils.mergeFragmentsAsObject({
          ...Object.fromEntries(
            modelFields.map((field) => [
              field.name,
              generateScalarField({
                enumName: field.enumType,
                isOptional: field.isOptional,
                scalarType: field.scalarType,
                dataUtilsImports,
                prismaGeneratedImports,
              }),
            ]),
          ),
          ...Object.fromEntries(
            extendedInputFields.map((field) => [field.name, field.value]),
          ),
        });

        const inputFieldsFragment = tsTemplate`
          export const ${modelName}InputFields = ${inputFieldsObject};`;

        return {
          providers: {
            prismaDataService: {
              getFieldNames() {
                return fieldNames;
              },
              registerMethod(method) {
                methods.add(method);
              },
            },
          },
          build: () => {
            serviceFile.registerHeader({
              name: 'input-fields',
              fragment: inputFieldsFragment,
            });

            for (const method of methods.getValue()) {
              serviceFile.registerMethod({
                name: method.name,
                order: TYPE_TO_ORDER[method.type],
                fragment: method.fragment,
                outputMethod: method.outputMethod,
              });
            }
          },
        };
      },
    }),
  }),
});
