import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import { projectScope, TsCodeUtils } from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { z } from 'zod';

import { prismaOutputProvider } from '#src/generators/prisma/prisma/prisma.generator.js';
import { prismaToServiceOutputDto } from '#src/types/service-output.js';
import { lowerCaseFirst } from '#src/utils/case.js';
import {
  createPothosTypeReference,
  writePothosExposeFieldFromDtoScalarField,
} from '#src/writers/pothos/index.js';

import {
  pothosFieldScope,
  pothosTypeOutputProvider,
} from '../_providers/index.js';
import { pothosTypesFileProvider } from '../pothos-types-file/pothos-types-file.generator.js';
import { pothosSchemaBaseTypesProvider } from '../pothos/pothos.generator.js';

const descriptorSchema = z.object({
  /**
   * The name of the model.
   */
  modelName: z.string().min(1),
  /**
   * The fields to expose.
   */
  exposedFields: z.array(z.string().min(1)),
  /**
   * The order of the type in the types file.
   */
  order: z.number(),
});

export interface PothosPrismaObjectProvider {
  addCustomField: (name: string, expression: TsCodeFragment) => void;
}

export const pothosPrismaObjectProvider =
  createProviderType<PothosPrismaObjectProvider>('pothos-prisma-object');

export function createPothosPrismaObjectTypeOutputName(
  modelName: string,
): string {
  return `prisma-object-type:${modelName}`;
}

export const pothosPrismaObjectGenerator = createGenerator({
  name: 'pothos/pothos-prisma-object',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks: ({ modelName, exposedFields, order }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        pothosTypeFile: pothosTypesFileProvider,
        pothosSchemaBaseTypes: pothosSchemaBaseTypesProvider,
      },
      exports: {
        pothosPrismaObject: pothosPrismaObjectProvider.export(pothosFieldScope),
        pothosTypeOutput: pothosTypeOutputProvider.export(
          projectScope,
          createPothosPrismaObjectTypeOutputName(modelName),
        ),
      },
      run({ prismaOutput, pothosTypeFile, pothosSchemaBaseTypes }) {
        const model = prismaOutput.getPrismaModel(modelName);

        const variableName = `${lowerCaseFirst(model.name)}ObjectType`;

        const customFields = createNonOverwriteableMap<
          Record<string, TsCodeFragment>
        >({});

        return {
          providers: {
            pothosPrismaObject: {
              addCustomField: (name, expression) => {
                customFields.set(name, expression);
              },
            },
            pothosTypeOutput: {
              getTypeReference: () =>
                createPothosTypeReference({
                  name: model.name,
                  exportName: variableName,
                  moduleSpecifier: pothosTypeFile.getModuleSpecifier(),
                }),
            },
          },
          build: () => {
            const outputDto = prismaToServiceOutputDto(model, (enumName) =>
              prismaOutput.getServiceEnum(enumName),
            );

            const missingField = exposedFields.find(
              (exposedFieldName) =>
                !outputDto.fields.some(
                  (field) => field.name === exposedFieldName,
                ),
            );

            if (missingField) {
              throw new Error(
                `Field ${missingField} not found in model ${model.name}`,
              );
            }

            const fieldDefinitions = outputDto.fields
              .filter((field) => exposedFields.includes(field.name))
              .map((field) => ({
                name: field.name,
                fragment:
                  field.type === 'scalar'
                    ? writePothosExposeFieldFromDtoScalarField(field, {
                        schemaBuilder: pothosTypeFile.getBuilderFragment(),
                        fieldBuilder: 't',
                        pothosSchemaBaseTypes,
                        typeReferences: [],
                      })
                    : `t.relation('${field.name}'${
                        field.isNullable ? ', { nullable: true }' : ''
                      })`,
              }));

            const objectTypeBlock = TsCodeUtils.formatFragment(
              `export const VARIABLE_NAME = BUILDER.prismaObject(MODEL_NAME, {
              fields: (t) => (FIELDS)
            });`,
              {
                VARIABLE_NAME: variableName,
                BUILDER: pothosTypeFile.getBuilderFragment(),
                MODEL_NAME: quot(model.name),
                FIELDS: TsCodeUtils.mergeFragmentsAsObject(
                  {
                    ...Object.fromEntries(
                      fieldDefinitions.map((fieldDefinition) => [
                        fieldDefinition.name,
                        fieldDefinition.fragment,
                      ]),
                    ),
                    ...customFields.value(),
                  },
                  { disableSort: true },
                ),
              },
            );

            pothosTypeFile.typeDefinitions.add({
              name: model.name,
              fragment: objectTypeBlock,
              order,
            });
          },
        };
      },
    }),
  }),
});
