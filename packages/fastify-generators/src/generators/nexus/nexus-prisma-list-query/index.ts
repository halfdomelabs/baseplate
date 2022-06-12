import { TypescriptSourceBlock } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import inflection from 'inflection';
import { z } from 'zod';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { nexusTypeProvider } from '@src/providers/nexus-type';
import { lowerCaseFirst } from '@src/utils/case';
import { nexusTypesFileProvider } from '../nexus-types-file';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  objectTypeName: z.string().optional(),
});

const LIST_TYPE_TEMPLATE = `
export const LIST_QUERY_EXPORT = queryField((t) => {
  t.field(QUERY_NAME, {
    type: nonNull(list(nonNull(OBJECT_TYPE_NAME))), // CUSTOM_FIELDS
    resolve: async (root, args, ctx, info) => MODEL.findMany({}),
  });
});
`.trim();

const NexusPrismaListQueryGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    authorize: {
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@baseplate/fastify/nexus/nexus-authorize-field',
      },
    },
  }),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    nexusTypesFile: nexusTypesFileProvider,
  },
  exports: {
    nexusType: nexusTypeProvider,
  },
  createGenerator(
    { modelName, objectTypeName },
    { prismaOutput, nexusTypesFile }
  ) {
    const objectTypeBlock = new TypescriptSourceBlock(
      {
        CUSTOM_FIELDS: {
          type: 'string-replacement',
          asSingleLineComment: true,
          transform: (value) => `\n${value},`,
        },
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
      LIST_QUERY_EXPORT: `${inflection.pluralize(lowerFirstModelName)}Query`,
      QUERY_NAME: `'${inflection.pluralize(lowerFirstModelName)}'`,
      OBJECT_TYPE_NAME: `'${objectTypeName || modelName}'`,
      MODEL: prismaOutput.getPrismaModelExpression(modelName),
    });

    return {
      getProviders: () => ({
        nexusType: {
          addCustomField(fieldName, fieldType) {
            objectTypeBlock.addStringReplacement(
              'CUSTOM_FIELDS',
              fieldType.prepend(`${fieldName}: `).toStringReplacement()
            );
          },
        },
      }),
      build: () => {
        nexusTypesFile.registerType(
          objectTypeBlock.renderToBlock(LIST_TYPE_TEMPLATE)
        );
      },
    };
  },
});

export default NexusPrismaListQueryGenerator;
