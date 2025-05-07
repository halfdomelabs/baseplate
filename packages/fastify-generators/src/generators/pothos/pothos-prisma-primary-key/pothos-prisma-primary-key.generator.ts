import { projectScope } from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import type { PothosWriterOptions } from '@src/writers/pothos/index.js';

import { getPrimaryKeyDefinition } from '@src/generators/prisma/_shared/crud-method/primary-key-input.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/prisma.generator.js';
import { lowerCaseFirst } from '@src/utils/case.js';
import {
  createPothosTypeReference,
  writePothosInputDefinitionFromDtoFields,
} from '@src/writers/pothos/index.js';

import { pothosTypeOutputProvider } from '../_providers/index.js';
import { pothosTypesFileProvider } from '../pothos-types-file/pothos-types-file.generator.js';
import { pothosSchemaBaseTypesProvider } from '../pothos/pothos.generator.js';

const descriptorSchema = z.object({
  /**
   * The name of the model.
   */
  modelName: z.string().min(1),
  /**
   * The order of the type in the types file.
   */
  order: z.number(),
});

export function getPothosPrismaPrimaryKeyTypeOutputName(
  modelName: string,
): string {
  return `prisma-primary-key-type:${modelName}`;
}

export const pothosPrismaPrimaryKeyGenerator = createGenerator({
  name: 'pothos/pothos-prisma-primary-key',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ modelName, order }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        pothosTypeFile: pothosTypesFileProvider,
        pothosSchemaBaseTypes: pothosSchemaBaseTypesProvider,
      },
      exports: {
        pothosTypeOutput: pothosTypeOutputProvider.export(
          projectScope,
          getPothosPrismaPrimaryKeyTypeOutputName(modelName),
        ),
      },
      run({ prismaOutput, pothosTypeFile, pothosSchemaBaseTypes }) {
        const model = prismaOutput.getPrismaModel(modelName);

        const inputName = `${model.name}PrimaryKey`;

        const writerOptions: PothosWriterOptions = {
          schemaBuilder: pothosTypeFile.getBuilderFragment(),
          fieldBuilder: 't',
          pothosSchemaBaseTypes,
          typeReferences: [],
        };
        const primaryKeyDefinition = getPrimaryKeyDefinition(model);

        if (
          primaryKeyDefinition.type === 'scalar' ||
          primaryKeyDefinition.isPrismaType === true
        ) {
          throw new Error(`Primary key for ${model.name} is not an object`);
        }

        const inputDefinition = writePothosInputDefinitionFromDtoFields(
          inputName,
          primaryKeyDefinition.nestedType.fields,
          writerOptions,
          true,
        );

        const typeReference = createPothosTypeReference({
          name: inputName,
          exportName: `${lowerCaseFirst(inputName)}InputType`,
          moduleSpecifier: pothosTypeFile.getModuleSpecifier(),
        });

        return {
          providers: {
            pothosTypeOutput: {
              getTypeReference: () => typeReference,
            },
          },
          build: () => {
            pothosTypeFile.typeDefinitions.add({
              name: inputName,
              fragment: inputDefinition.fragment,
              order,
            });
          },
        };
      },
    }),
  }),
});
