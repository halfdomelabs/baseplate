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
   * Names of the scalar fields that may be filtered on. Mirrors the fields
   * already exposed on the model's GraphQL object type so filtering can
   * never expose more than reads already do.
   */
  filterableFields: z.array(z.string().min(1)),
});

export function getPothosPrismaWhereInputTypeOutputName(
  modelName: string,
): string {
  return `prisma-where-input-type:${modelName}`;
}

export const pothosPrismaWhereInputGenerator = createGenerator({
  name: 'pothos/pothos-prisma-where-input',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ modelName, order, filterableFields }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        pothosTypeFile: pothosTypesFileProvider,
        pothosSchemaBaseTypes: pothosSchemaBaseTypesProvider,
      },
      exports: {
        pothosTypeOutput: pothosTypeOutputProvider.export(
          packageScope,
          getPothosPrismaWhereInputTypeOutputName(modelName),
        ),
      },
      run({ prismaOutput, pothosTypeFile, pothosSchemaBaseTypes }) {
        const model = prismaOutput.getPrismaModel(modelName);
        const inputName = `${model.name}WhereInput`;
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

            const missingField = filterableFields.find(
              (fieldName) =>
                !outputDto.fields.some((field) => field.name === fieldName),
            );

            if (missingField) {
              throw new Error(
                `Field ${missingField} not found in model ${model.name}`,
              );
            }

            const scalarFieldFragments = Object.fromEntries(
              outputDto.fields
                .filter(
                  (field): field is Extract<typeof field, { type: 'scalar' }> =>
                    field.type === 'scalar' &&
                    filterableFields.includes(field.name),
                )
                .flatMap((field) => {
                  const filterTypeName =
                    field.scalarType === 'enum'
                      ? (() => {
                          if (!field.enumType) {
                            throw new Error(
                              `All enum fields must have enumType specified!`,
                            );
                          }
                          return `${field.enumType.name}Filter`;
                        })()
                      : `${pothosSchemaBaseTypes.scalarConfig(field.scalarType).name}Filter`;
                  // Some scalar types (e.g. json/jsonObject) have no
                  // registered filter type on purpose — skip them rather
                  // than fail generation.
                  const filterRef =
                    pothosSchemaBaseTypes.inputRef(filterTypeName)?.fragment;
                  if (!filterRef) {
                    return [];
                  }
                  return [
                    [
                      field.name,
                      TsCodeUtils.formatFragment('t.field({ type: TYPE })', {
                        TYPE: filterRef,
                      }),
                    ],
                  ];
                }),
            );

            // The ref is declared and exported separately from `.implement()`
            // (rather than exporting the `.implement()` result directly) so
            // TypeScript can name the exported type without an explicit
            // annotation — `.implement()`'s return type isn't portable under
            // `declaration: true`.
            const whereInputBlock = TsCodeUtils.formatFragment(
              `export const VARIABLE_NAME = BUILDER.inputRef(INPUT_NAME);

              VARIABLE_NAME.implement({
                fields: (t) => (FIELDS),
              });`,
              {
                VARIABLE_NAME: variableName,
                BUILDER: pothosTypeFile.getBuilderFragment(),
                INPUT_NAME: quot(inputName),
                FIELDS: TsCodeUtils.mergeFragmentsAsObject(
                  {
                    ...scalarFieldFragments,
                    AND: TsCodeUtils.formatFragment(
                      't.field({ type: [VARIABLE_NAME] })',
                      { VARIABLE_NAME: variableName },
                    ),
                    OR: TsCodeUtils.formatFragment(
                      't.field({ type: [VARIABLE_NAME] })',
                      { VARIABLE_NAME: variableName },
                    ),
                    NOT: TsCodeUtils.formatFragment(
                      't.field({ type: VARIABLE_NAME })',
                      { VARIABLE_NAME: variableName },
                    ),
                  },
                  { disableSort: true },
                ),
              },
            );

            pothosTypeFile.typeDefinitions.add({
              name: inputName,
              fragment: whereInputBlock,
              order,
            });
          },
        };
      },
    }),
  }),
});
