import { TypescriptSourceBlock } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { scalarPrismaFieldToServiceField } from '@src/types/serviceOutput';
import { lowerCaseFirst } from '@src/utils/case';
import { quot } from '@src/utils/string';
import { writeNexusArgsFromDtoFields } from '@src/writers/nexus-args';
import { NexusDefinitionWriterOptions } from '@src/writers/nexus-definition';
import { nexusSchemaProvider } from '../nexus';
import { nexusTypesFileProvider } from '../nexus-types-file';

const descriptorSchema = yup.object({
  modelName: yup.string().required(),
  objectTypeName: yup.string(),
});

const OBJECT_TYPE_TEMPLATE = `
export const QUERY_EXPORT = queryField((t) => {
  t.field(QUERY_NAME, {
    type: nonNull(OBJECT_TYPE_NAME),
    args: QUERY_ARGS,
    resolve: async (root, ARG_INPUT, ctx, info) => MODEL.findUnique({where: MODEL_WHERE, rejectOnNotFound: true}),
  });
});
`.trim();

const NexusPrismaListQueryGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    nexusTypesFile: nexusTypesFileProvider,
    nexusSchema: nexusSchemaProvider,
  },
  createGenerator(
    { modelName, objectTypeName },
    { prismaOutput, nexusTypesFile, nexusSchema }
  ) {
    const modelOutput = prismaOutput.getPrismaModel(modelName);

    const { idFields } = modelOutput;

    if (!idFields || idFields.length > 1) {
      throw new Error('Only one id field is supported');
    }

    const objectTypeBlock = new TypescriptSourceBlock(
      {
        QUERY_EXPORT: { type: 'code-expression' },
        QUERY_NAME: { type: 'code-expression' },
        OBJECT_TYPE_NAME: { type: 'code-expression' },
        QUERY_ARGS: { type: 'code-expression' },
        MODEL: { type: 'code-expression' },
        ARG_INPUT: { type: 'code-expression' },
        MODEL_WHERE: { type: 'code-expression' },
      },
      {
        importText: ["import { queryField, nonNull } from 'nexus';"],
      }
    );

    const idFieldName = idFields[0];
    const idField = modelOutput.fields.find(
      (field) => field.name === idFieldName
    );
    if (!idField || idField.type !== 'scalar') {
      throw new Error(`Could not find ID field ${idFieldName}`);
    }

    const writerOptions: NexusDefinitionWriterOptions = {
      builder: 't',
      lookupScalar: (scalar) => nexusSchema.getScalarConfig(scalar),
    };

    const lowerFirstModelName = lowerCaseFirst(modelName);

    objectTypeBlock.addCodeEntries({
      QUERY_EXPORT: lowerFirstModelName,
      QUERY_NAME: quot(lowerFirstModelName),
      OBJECT_TYPE_NAME: `'${objectTypeName || modelName}'`,
      QUERY_ARGS: writeNexusArgsFromDtoFields(
        [scalarPrismaFieldToServiceField(idField)],
        writerOptions
      ).expression,
      MODEL: prismaOutput.getPrismaModelExpression(modelName),
      ARG_INPUT: `{ ${idFieldName} }`,
      MODEL_WHERE: `{ ${idFieldName} }`,
    });

    nexusTypesFile.registerType(
      objectTypeBlock.renderToBlock(OBJECT_TYPE_TEMPLATE)
    );

    return {
      build: async () => {},
    };
  },
});

export default NexusPrismaListQueryGenerator;
