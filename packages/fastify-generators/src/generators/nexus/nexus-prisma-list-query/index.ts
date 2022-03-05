import { TypescriptSourceBlock } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import inflection from 'inflection';
import * as yup from 'yup';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { lowerCaseFirst } from '@src/utils/case';
import { nexusTypesProvider } from '../nexus-types';

const descriptorSchema = yup.object({
  modelName: yup.string().required(),
  objectTypeName: yup.string(),
});

const OBJECT_TYPE_TEMPLATE = `
export const LIST_QUERY_EXPORT = queryField((t) => {
  t.field(QUERY_NAME, {
    type: nonNull(list(nonNull(OBJECT_TYPE_NAME))),
    resolve: async (root, args, ctx, info) => MODEL.findMany({}),
  });
});
`.trim();

const NexusPrismaObjectGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    nexusTypes: nexusTypesProvider,
  },
  createGenerator({ modelName, objectTypeName }, { prismaOutput, nexusTypes }) {
    const objectTypeBlock = new TypescriptSourceBlock(
      {
        LIST_QUERY_EXPORT: { type: 'code-expression' },
        QUERY_NAME: { type: 'code-expression' },
        OBJECT_TYPE_NAME: { type: 'code-expression' },
        MODEL: { type: 'code-expression' },
      },
      {
        importText: ["import { queryField, nonNull, list } from 'nexus';"],
      }
    );

    const lowerFirstModelName = lowerCaseFirst(modelName);

    objectTypeBlock.addCodeEntries({
      LIST_QUERY_EXPORT: `${lowerFirstModelName}ListQuery`,
      QUERY_NAME: `'${inflection.pluralize(lowerFirstModelName)}'`,
      OBJECT_TYPE_NAME: `'${objectTypeName || modelName}'`,
      MODEL: prismaOutput.getPrismaModelExpression(modelName),
    });

    nexusTypes.registerType(
      objectTypeBlock.renderToBlock(OBJECT_TYPE_TEMPLATE)
    );

    return {
      build: async () => {},
    };
  },
});

export default NexusPrismaObjectGenerator;
