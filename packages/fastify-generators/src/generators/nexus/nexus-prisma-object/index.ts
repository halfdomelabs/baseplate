import {
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  TypescriptSourceBlock,
} from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import { prismaToServiceOutputDto } from '@src/types/serviceOutput.js';
import { lowerCaseFirst } from '@src/utils/case.js';
import { writeNexusDefinitionFromDtoScalarField } from '@src/writers/nexus-definition/index.js';
import { nexusSchemaProvider } from '../nexus/index.js';
import { nexusTypesFileProvider } from '../nexus-types-file/index.js';
import { writeObjectTypeRelationField } from './relationField.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  exposedFields: z.array(z.string().min(1)),
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
    { modelName, exposedFields },
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

    const outputDto = prismaToServiceOutputDto(model, (enumName) =>
      prismaOutput.getServiceEnum(enumName)
    );

    const writerOptions = nexusSchema.getNexusWriterOptions();

    const missingField = exposedFields.find(
      (exposedFieldName) =>
        !outputDto.fields.some((field) => field.name === exposedFieldName)
    );

    if (missingField) {
      throw new Error(`Field ${missingField} not found in model ${model.name}`);
    }

    const fieldDefinitions = outputDto.fields
      .filter((field) => exposedFields.includes(field.name))
      .map((field) => {
        if (field.type === 'scalar') {
          return new TypescriptCodeBlock(
            writeNexusDefinitionFromDtoScalarField(field, writerOptions)
          );
        }
        return writeObjectTypeRelationField(field, model, {
          prismaOutput,
          writerOptions,
        });
      });
    objectTypeBlock.addCodeBlock(
      'OBJECT_TYPE_DEFINITION',
      TypescriptCodeUtils.mergeBlocks(fieldDefinitions, '\n')
    );

    nexusTypesFile.registerType({
      block: objectTypeBlock.renderToBlock(OBJECT_TYPE_TEMPLATE),
      category: 'object-type',
    });

    return {
      build: async () => {},
    };
  },
});

export default NexusPrismaObjectGenerator;
