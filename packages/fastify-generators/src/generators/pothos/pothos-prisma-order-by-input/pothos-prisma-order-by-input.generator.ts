import { packageScope, TsCodeUtils } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { prismaOutputProvider } from '#src/generators/prisma/prisma/index.js';
import { prismaToServiceOutputDto } from '#src/types/service-output.js';
import { lowerCaseFirst } from '#src/utils/case.js';
import { createPothosTypeReference } from '#src/writers/pothos/options.js';

import { pothosTypeOutputProvider } from '../_providers/index.js';
import { pothosTypesFileProvider } from '../pothos-types-file/index.js';
import { pothosSchemaBaseTypesProvider } from '../pothos/index.js';

const descriptorSchema = z.object({
  /**
   * The name of the model.
   */
  modelName: z.string().min(1),
  /**
   * The order of the type in the types file.
   */
  order: z.number(),
  /**
   * Names of the scalar fields that may be sorted on. Mirrors the fields
   * already exposed on the model's GraphQL object type so sorting can
   * never expose more than reads already do.
   */
  sortableFields: z.array(z.string().min(1)),
});

/**
 * Scalar types Prisma cannot order by (unordered blobs). A model that
 * marks one of these sortable is a configuration error caught at build
 * time rather than silently ignored.
 */
const NON_SORTABLE_SCALAR_TYPES = new Set(['json', 'jsonObject']);

export function getPothosPrismaOrderByInputTypeOutputName(
  modelName: string,
): string {
  return `prisma-order-by-input-type:${modelName}`;
}

export const pothosPrismaOrderByInputGenerator = createGenerator({
  name: 'pothos/pothos-prisma-order-by-input',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ modelName, order, sortableFields }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        pothosTypeFile: pothosTypesFileProvider,
        pothosSchemaBaseTypes: pothosSchemaBaseTypesProvider,
      },
      exports: {
        pothosTypeOutput: pothosTypeOutputProvider.export(
          packageScope,
          getPothosPrismaOrderByInputTypeOutputName(modelName),
        ),
      },
      run({ prismaOutput, pothosTypeFile, pothosSchemaBaseTypes }) {
        const model = prismaOutput.getPrismaModel(modelName);
        const inputName = `${model.name}OrderByInput`;
        const variableName = `${lowerCaseFirst(inputName)}Type`;

        const typeReference = createPothosTypeReference({
          name: inputName,
          exportName: variableName,
          moduleSpecifier: pothosTypeFile.getModuleSpecifier(),
        });

        return {
          providers: {
            pothosTypeOutput: {
              getTypeReference: () => typeReference,
            },
          },
          build: () => {
            const outputDto = prismaToServiceOutputDto(model, (enumName) =>
              prismaOutput.getServiceEnum(enumName),
            );

            const missingField = sortableFields.find(
              (fieldName) =>
                !outputDto.fields.some((field) => field.name === fieldName),
            );

            if (missingField) {
              throw new Error(
                `Field ${missingField} not found in model ${model.name}`,
              );
            }

            const sortableScalarFields = outputDto.fields.filter(
              (field): field is Extract<typeof field, { type: 'scalar' }> =>
                field.type === 'scalar' && sortableFields.includes(field.name),
            );

            if (sortableScalarFields.length === 0) {
              throw new Error(
                `Model ${model.name} has no sortable fields but an OrderByInput type was ` +
                  `requested. GraphQL input types must declare at least one field. Mark a ` +
                  `scalar field on ${model.name} as sortable, or disable ordering on the ` +
                  `list query and any relations targeting this model.`,
              );
            }

            const nonSortableField = sortableScalarFields.find((field) =>
              NON_SORTABLE_SCALAR_TYPES.has(field.scalarType),
            );

            if (nonSortableField) {
              throw new Error(
                `Field ${nonSortableField.name} on model ${model.name} has scalar type ` +
                  `'${nonSortableField.scalarType}', which cannot be sorted on. Remove it ` +
                  `from the model's sortable fields.`,
              );
            }

            const sortOrderRef =
              pothosSchemaBaseTypes.enumRefOrThrow('SortOrder').fragment;

            const scalarFieldFragments = Object.fromEntries(
              sortableScalarFields.map((field) => [
                field.name,
                TsCodeUtils.formatFragment('t.field({ type: TYPE })', {
                  TYPE: sortOrderRef,
                }),
              ]),
            );

            // The ref is declared and exported separately from `.implement()`
            // (rather than exporting the `.implement()` result directly) so
            // TypeScript can name the exported type without an explicit
            // annotation — `.implement()`'s return type isn't portable under
            // `declaration: true`.
            const orderByInputBlock = TsCodeUtils.formatFragment(
              `export const VARIABLE_NAME = BUILDER.inputRef(INPUT_NAME);

              VARIABLE_NAME.implement({
                fields: (t) => (FIELDS),
              });`,
              {
                VARIABLE_NAME: variableName,
                BUILDER: pothosTypeFile.getBuilderFragment(),
                INPUT_NAME: quot(inputName),
                FIELDS: TsCodeUtils.mergeFragmentsAsObject(
                  scalarFieldFragments,
                  { disableSort: true },
                ),
              },
            );

            pothosTypeFile.typeDefinitions.add({
              name: inputName,
              fragment: orderByInputBlock,
              order,
            });
          },
        };
      },
    }),
  }),
});
