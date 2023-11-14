import { TypescriptSourceBlock } from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';

import { nexusSchemaProvider } from '../nexus/index.js';
import { nexusTypesFileProvider } from '../nexus-types-file/index.js';
import { getPrimaryKeyDefinition } from '@src/generators/prisma/_shared/crud-method/primary-key-input.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import { nexusTypeProvider } from '@src/providers/nexus-type.js';
import { lowerCaseFirst } from '@src/utils/case.js';
import { quot } from '@src/utils/string.js';
import { writeNexusArgsFromDtoFields } from '@src/writers/nexus-args/index.js';
import {
  NexusDefinitionWriterOptions,
  writeChildInputDefinition,
} from '@src/writers/nexus-definition/index.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  objectTypeName: z.string().optional(),
});

const QUERY_TYPE_TEMPLATE = `
export const QUERY_EXPORT = queryField((t) => {
  t.field(QUERY_NAME, {
    type: nonNull(OBJECT_TYPE_NAME), // CUSTOM_FIELDS
    args: QUERY_ARGS,
    resolve: async (root, ARG_INPUT, ctx, info) => MODEL.findUniqueOrThrow({where: MODEL_WHERE}),
  });
});
`.trim();

const NexusPrismaListQueryGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    authorize: {
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/nexus/nexus-authorize-field',
      },
    },
  }),
  dependencies: {
    prismaOutput: prismaOutputProvider,
    nexusTypesFile: nexusTypesFileProvider,
    nexusSchema: nexusSchemaProvider,
  },
  exports: {
    nexusType: nexusTypeProvider,
  },
  createGenerator(
    { modelName, objectTypeName },
    { prismaOutput, nexusTypesFile, nexusSchema },
  ) {
    const modelOutput = prismaOutput.getPrismaModel(modelName);

    const { idFields } = modelOutput;

    if (!idFields) {
      throw new Error(`Model ${modelName} does not have an ID field`);
    }

    const objectTypeBlock = new TypescriptSourceBlock(
      {
        CUSTOM_FIELDS: {
          type: 'string-replacement',
          asSingleLineComment: true,
          transform: (value) => `\n${value},`,
        },
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
      },
    );

    const primaryKeyDefinition = getPrimaryKeyDefinition(modelOutput);

    const writerOptions: NexusDefinitionWriterOptions = {
      builder: 't',
      lookupScalar: (scalar) => nexusSchema.getScalarConfig(scalar),
    };

    const lowerFirstModelName = lowerCaseFirst(modelName);

    const nexusArgs = writeNexusArgsFromDtoFields(
      [primaryKeyDefinition],
      writerOptions,
    );

    nexusArgs.childInputDefinitions.forEach((child) => {
      nexusTypesFile.registerType({
        name: child.name,
        block: writeChildInputDefinition(child),
      });
    });

    objectTypeBlock.addCodeEntries({
      QUERY_EXPORT: `${lowerFirstModelName}Query`,
      QUERY_NAME: quot(lowerFirstModelName),
      OBJECT_TYPE_NAME: `'${objectTypeName || modelName}'`,
      QUERY_ARGS: nexusArgs.expression,
      MODEL: prismaOutput.getPrismaModelExpression(modelName),
      ARG_INPUT: `{ ${primaryKeyDefinition.name} }`,
      MODEL_WHERE: `{ ${primaryKeyDefinition.name} }`,
    });

    return {
      getProviders: () => ({
        nexusType: {
          addCustomField(fieldName, fieldType) {
            objectTypeBlock.addStringReplacement(
              'CUSTOM_FIELDS',
              fieldType.prepend(`${fieldName}: `).toStringReplacement(),
            );
          },
        },
      }),
      build: () => {
        nexusTypesFile.registerType({
          category: 'find-query',
          block: objectTypeBlock.renderToBlock(QUERY_TYPE_TEMPLATE),
        });
      },
    };
  },
});

export default NexusPrismaListQueryGenerator;
