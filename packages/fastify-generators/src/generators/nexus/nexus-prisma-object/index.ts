import {
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  TypescriptSourceBlock,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { prismaToServiceOutputDto } from '@src/types/serviceOutput';
import { lowerCaseFirst } from '@src/utils/case';
import {
  writeNexusDefinitionFromDtoScalarField,
  writeNexusObjectTypeFieldFromDtoNestedField,
} from '@src/writers/nexus-definition';
import { nexusSchemaProvider } from '../nexus';
import { nexusTypesFileProvider } from '../nexus-types-file';

const descriptorSchema = yup.object({
  modelName: yup.string().required(),
  exposedFields: yup.array(yup.string().required()).required(),
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
    const modelExpression = prismaOutput.getPrismaModelExpression(modelName);

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
        if (!model.idFields) {
          throw new Error('ID field required for relationships');
        }
        const RESOLVER_TEMPLATE = `
(INPUT) => MODEL.findUnique({ where: WHERE_CLAUSE }).RELATION_NAME()
`.trim();
        const resolver = TypescriptCodeUtils.formatExpression(
          RESOLVER_TEMPLATE,
          {
            INPUT: `{${model.idFields.join(', ')}}`,
            MODEL: modelExpression,
            WHERE_CLAUSE: `{${model.idFields.join(', ')}}`,
            RELATION_NAME: field.name,
          }
        );
        return writeNexusObjectTypeFieldFromDtoNestedField(
          field,
          resolver,
          writerOptions
        );
      });
    objectTypeBlock.addCodeBlock(
      'OBJECT_TYPE_DEFINITION',
      TypescriptCodeUtils.mergeBlocks(fieldDefinitions, '\n')
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
