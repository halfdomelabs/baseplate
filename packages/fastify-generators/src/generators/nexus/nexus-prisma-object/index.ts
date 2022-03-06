import { TypescriptSourceBlock } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { prismaToServiceOutputDto } from '@src/types/serviceOutput';
import { lowerCaseFirst } from '@src/utils/case';
import { writeScalarNexusDefinitionFromDtoFields } from '@src/writers/nexus-definition';
import { nexusSchemaProvider } from '../nexus';
import { nexusTypesFileProvider } from '../nexus-types-file';

const descriptorSchema = yup.object({
  modelName: yup.string().required(),
});

const OBJECT_TYPE_TEMPLATE = `
export const OBJECT_TYPE_EXPORT = objectType({
  name: MODEL_NAME,
  definition(t) {
    OBJECT_TYPE_DEFINITION;
  },
  sourceType: {
    module: '@prisma/client',
    export: MODEL_NAME,
  },
});
`.trim();

const NexusPrismaObjectGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    nexusTypesFile: nexusTypesFileProvider,
    nexusSchema: nexusSchemaProvider,
  },
  createGenerator(
    { modelName },
    { prismaOutput, nexusTypesFile, nexusSchema }
  ) {
    const model = prismaOutput.getPrismaModel(modelName);

    const objectTypeBlock = new TypescriptSourceBlock(
      {
        OBJECT_TYPE_EXPORT: { type: 'code-expression' },
        OBJECT_TYPE_DEFINITION: { type: 'code-block' },
        MODEL_NAME: { type: 'code-expression' },
      },
      {
        importText: ["import { objectType } from 'nexus';"],
      }
    );

    objectTypeBlock.addCodeExpression(
      'OBJECT_TYPE_EXPORT',
      `${lowerCaseFirst(model.name)}ObjectType`
    );
    objectTypeBlock.addCodeExpression('MODEL_NAME', `'${model.name}'`);

    const outputDto = prismaToServiceOutputDto(model);
    objectTypeBlock.addCodeBlock(
      'OBJECT_TYPE_DEFINITION',
      writeScalarNexusDefinitionFromDtoFields(outputDto.fields, {
        builder: 't',
        lookupScalar: (scalar) => nexusSchema.getScalarConfig(scalar),
      })
    );

    nexusTypesFile.registerType(
      objectTypeBlock.renderToBlock(OBJECT_TYPE_TEMPLATE)
    );

    return {
      build: async () => {},
    };
  },
});

export default NexusPrismaObjectGenerator;
