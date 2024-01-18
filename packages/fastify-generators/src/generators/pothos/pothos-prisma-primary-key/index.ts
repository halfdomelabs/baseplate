import {
  createGeneratorWithTasks,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { pothosSchemaProvider } from '../pothos/index.js';
import { pothosTypesFileProvider } from '../pothos-types-file/index.js';
import { getPrimaryKeyDefinition } from '@src/generators/prisma/_shared/crud-method/primary-key-input.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import { pothosTypeOutputProvider } from '@src/providers/pothos-type.js';
import { lowerCaseFirst } from '@src/utils/case.js';
import {
  PothosWriterOptions,
  writePothosInputDefinitionFromDtoFields,
} from '@src/writers/pothos/index.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
});

type Descriptor = z.infer<typeof descriptorSchema>;

const createMainTask = createTaskConfigBuilder(({ modelName }: Descriptor) => ({
  name: 'main',
  dependencies: {
    prismaOutput: prismaOutputProvider,
    pothosTypeFile: pothosTypesFileProvider,
    pothosSchema: pothosSchemaProvider,
  },
  exports: {
    pothosTypeOutput: pothosTypeOutputProvider,
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
      getProviders: () => ({
        pothosTypeOutput: {
          getTypeReference: () => typeReference,
        },
      }),
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
}));

const PothosPrismaPrimaryKeyGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default PothosPrismaPrimaryKeyGenerator;
