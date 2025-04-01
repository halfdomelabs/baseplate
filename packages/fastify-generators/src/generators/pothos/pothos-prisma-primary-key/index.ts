import { projectScope } from '@halfdomelabs/core-generators';
import { createGenerator } from '@halfdomelabs/sync';
import { z } from 'zod';

import type { PothosWriterOptions } from '@src/writers/pothos/index.js';

import { getPrimaryKeyDefinition } from '@src/generators/prisma/_shared/crud-method/primary-key-input.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import { pothosTypeOutputProvider } from '@src/providers/pothos-type.js';
import { lowerCaseFirst } from '@src/utils/case.js';
import { writePothosInputDefinitionFromDtoFields } from '@src/writers/pothos/index.js';

import { pothosTypesFileProvider } from '../pothos-types-file/index.js';
import { pothosSchemaProvider } from '../pothos/index.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
});

export const pothosPrismaPrimaryKeyGenerator = createGenerator({
  name: 'pothos/pothos-prisma-primary-key',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, { modelName }) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        prismaOutput: prismaOutputProvider,
        pothosTypeFile: pothosTypesFileProvider,
        pothosSchema: pothosSchemaProvider,
      },
      exports: {
        pothosTypeOutput: pothosTypeOutputProvider.export(
          projectScope,
          `prisma-primary-key-type:${modelName}`,
        ),
      },
      run({ prismaOutput, pothosTypeFile, pothosSchema }) {
        const model = prismaOutput.getPrismaModel(modelName);

        const inputName = `${model.name}PrimaryKey`;

        const writerOptions: PothosWriterOptions = {
          schemaBuilder: 'builder',
          fieldBuilder: 't',
          typeReferences: pothosSchema.getTypeReferences(),
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

        const typeReference = {
          typeName: inputName,
          exportName: `${lowerCaseFirst(inputName)}InputType`,
          moduleName: pothosTypeFile.getModuleName(),
        };

        return {
          providers: {
            pothosTypeOutput: {
              getTypeReference: () => typeReference,
            },
          },
          build: () => {
            const typeReferences = pothosSchema.getTypeReferences();

            typeReferences.addInputType(typeReference);

            pothosTypeFile.registerType({
              block: inputDefinition.definition,
              category: 'input-type',
            });
          },
        };
      },
    });
  },
});
