import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  TsCodeUtils,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTaskWithInfo,
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import {
  lowercaseFirstChar,
  NamedArrayFieldContainer,
} from '@baseplate-dev/utils';
import { z } from 'zod';

import type { PrismaOutputScalarField } from '#src/types/prisma-output.js';
import type { ServiceOutputMethod } from '#src/types/service-output.js';

import { serviceFileProvider } from '#src/generators/core/index.js';

import type { InputFieldDefinitionOutput } from '../_shared/field-definition-generators/types.js';

import { prismaGeneratedImportsProvider } from '../_providers/prisma-generated-imports.js';
import { generateScalarInputField } from '../_shared/field-definition-generators/generate-scalar-input-field.js';
import { dataUtilsImportsProvider } from '../data-utils/index.js';
import { prismaOutputProvider } from '../prisma/prisma.generator.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  modelFieldNames: z.array(z.string()),
});

type Descriptor = z.infer<typeof descriptorSchema>;

const [
  createPrismaDataServiceTask,
  prismaDataServiceSetupProvider,
  prismaDataServiceValuesProvider,
] = createConfigProviderTaskWithInfo(
  (t) => ({
    /** Additional model field names to add to the data service */
    additionalModelFieldNames: t.array<string>([]),
    /** Virtual input fields to add to the data service */
    virtualInputFields: t.namedArray<InputFieldDefinitionOutput>([]),
  }),
  {
    prefix: 'prisma-data-service',
    configScope: (provider, descriptor) =>
      provider.export().andExport(packageScope, descriptor.modelName),
    infoFromDescriptor: (descriptor: Descriptor) => ({
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
  getFields(): InputFieldDefinitionOutput[];
  getFieldsVariableName(): string;
  /**
   * Gets the fragment with the fields imported in.
   */
  getFieldsFragment(): TsCodeFragment;
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
  buildTasks: (descriptor) => ({
    config: createPrismaDataServiceTask(descriptor),
    main: createGeneratorTask({
      dependencies: {
        configValues: prismaDataServiceValuesProvider,
        prismaOutput: prismaOutputProvider,
        serviceFile: serviceFileProvider,
        dataUtilsImports: dataUtilsImportsProvider,
        prismaGeneratedImports: prismaGeneratedImportsProvider,
      },
      exports: {
        prismaDataService: prismaDataServiceProvider
          .export()
          .andExport(packageScope, descriptor.modelName),
      },
      run({
        configValues,
        prismaOutput,
        serviceFile,
        dataUtilsImports,
        prismaGeneratedImports,
      }) {
        const { modelName, modelFieldNames } = descriptor;
        const model = prismaOutput.getPrismaModel(modelName);
        const { virtualInputFields, additionalModelFieldNames } = configValues;
        const modelScalarFields = model.fields.filter(
          (f): f is PrismaOutputScalarField => f.type === 'scalar',
        );

        const modelScalarFieldNames = new Set([
          ...modelFieldNames,
          ...additionalModelFieldNames,
        ]);

        const invalidModelFieldNames = modelFieldNames.filter(
          (fieldName) => !modelScalarFieldNames.has(fieldName),
        );
        if (invalidModelFieldNames.length > 0) {
          throw new Error(
            `Fields ${invalidModelFieldNames.join(', ')} are not scalar fields in model ${modelName}`,
          );
        }

        const methods = new NamedArrayFieldContainer<PrismaDataServiceMethod>();

        // Check if modelFields and virtual input fields overlap
        const overlappingFields = virtualInputFields.filter((field) =>
          modelScalarFieldNames.has(field.name),
        );
        if (overlappingFields.length > 0) {
          throw new Error(
            `Fields ${overlappingFields.map((field) => field.name).join(', ')} overlap with model fields`,
          );
        }

        const inputFields = [
          // preserve order of model fields
          ...modelScalarFields
            .filter((f) => modelScalarFieldNames.has(f.name))
            .map((field) =>
              generateScalarInputField({
                fieldName: field.name,
                scalarField: field,
                dataUtilsImports,
                prismaGeneratedImports,
                lookupEnum: (name) => prismaOutput.getServiceEnum(name),
              }),
            ),
          ...virtualInputFields.toSorted((a, b) =>
            a.name.localeCompare(b.name),
          ),
        ];

        const inputFieldsObject = TsCodeUtils.mergeFragmentsAsObject(
          Object.fromEntries(
            inputFields.map((field) => [field.name, field.fragment]),
          ),
          { disableSort: true },
        );

        const fieldsVariableName = `${lowercaseFirstChar(modelName)}InputFields`;

        const inputFieldsFragment = tsTemplate`
          export const ${fieldsVariableName} = ${inputFieldsObject};`;

        return {
          providers: {
            prismaDataService: {
              getFields() {
                return inputFields;
              },
              getFieldsVariableName() {
                return fieldsVariableName;
              },
              getFieldsFragment() {
                return TsCodeUtils.importFragment(
                  fieldsVariableName,
                  serviceFile.getServicePath(),
                );
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
