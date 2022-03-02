import { TypescriptSourceBlock } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { prismaToServiceOutputDto } from '@src/types/serviceOutput';
import { lowerCaseFirst } from '@src/utils/case';
import { writeNexusDefinitionFromDtoFields } from '@src/writers/nexus-definition';
import { nexusSchemaProvider } from '../nexus';
import { nexusTypesProvider } from '../nexus-types';

const descriptorSchema = yup.object({
  modelName: yup.string().required(),
});

const OBJECT_TYPE_TEMPLATE = `
import { objectType } from 'nexus';

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
    nexusTypes: nexusTypesProvider,
    nexusSchema: nexusSchemaProvider,
  },
  createGenerator({ modelName }, { prismaOutput, nexusTypes, nexusSchema }) {
    const model = prismaOutput.getPrismaModel(modelName);

    const objectTypeBlock = new TypescriptSourceBlock({
      OBJECT_TYPE_EXPORT: { type: 'code-expression' },
      OBJECT_TYPE_DEFINITION: { type: 'code-block' },
      MODEL_NAME: { type: 'code-expression' },
    });

    objectTypeBlock.addCodeExpression(
      'OBJECT_TYPE_EXPORT',
      `${lowerCaseFirst(model.name)}ObjectType`
    );
    objectTypeBlock.addCodeExpression('MODEL_NAME', `'${model.name}'`);

    const outputDto = prismaToServiceOutputDto(model);
    objectTypeBlock.addCodeBlock(
      'OBJECT_TYPE_DEFINITION',
      writeNexusDefinitionFromDtoFields(outputDto.fields, {
        builder: 't',
        lookupScalar: (scalar) => nexusSchema.getScalarConfig(scalar),
      })
    );

    nexusTypes.registerType(
      objectTypeBlock.renderToBlock(OBJECT_TYPE_TEMPLATE)
    );

    return {
      build: async (builder) => {},
    };
  },
});

export default NexusPrismaObjectGenerator;
