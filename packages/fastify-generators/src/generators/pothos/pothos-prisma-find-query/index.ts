import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createTaskConfigBuilder,
} from '@baseplate/sync';
import { z } from 'zod';
import { getPrimaryKeyDefinition } from '@src/generators/prisma/_shared/crud-method/primary-key-input';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { pothosFieldProvider } from '@src/providers/pothos-field';
import { lowerCaseFirst } from '@src/utils/case';
import { quot } from '@src/utils/string';
import {
  PothosWriterOptions,
  writePothosArgsFromDtoFields,
} from '@src/writers/pothos';
import { pothosSchemaProvider } from '../pothos';
import { pothosTypesFileProvider } from '../pothos-types-file';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
});

type Descriptor = z.infer<typeof descriptorSchema>;

const createMainTask = createTaskConfigBuilder(({ modelName }: Descriptor) => ({
  name: 'main',
  dependencies: {
    prismaOutput: prismaOutputProvider,
    pothosTypesFile: pothosTypesFileProvider,
    pothosSchema: pothosSchemaProvider,
  },
  exports: {
    pothosField: pothosFieldProvider,
  },
  run({ prismaOutput, pothosSchema, pothosTypesFile }) {
    const modelOutput = prismaOutput.getPrismaModel(modelName);

    const { idFields } = modelOutput;

    if (!idFields) {
      throw new Error(`Model ${modelName} does not have an ID field`);
    }

    const primaryKeyDefinition = getPrimaryKeyDefinition(modelOutput);

    const writerOptions: PothosWriterOptions = {
      schemaBuilder: 'builder',
      fieldBuilder: 't',
      typeReferences: pothosSchema.getTypeReferences(),
    };

    const lowerFirstModelName = lowerCaseFirst(modelName);

    const customFields = createNonOverwriteableMap<
      Record<string, TypescriptCodeExpression>
    >({});

    return {
      getProviders: () => ({
        pothosField: {
          addCustomOption(field) {
            customFields.set(field.name, field.value);
          },
        },
      }),
      build: () => {
        const pothosArgs = writePothosArgsFromDtoFields(
          [primaryKeyDefinition],
          writerOptions
        );

        pothosArgs.childDefinitions?.forEach((child) => {
          pothosTypesFile.registerType({
            name: child.name,
            block: child.definition,
          });
        });

        const resolveFunction = TypescriptCodeUtils.formatExpression(
          `async (query, root, ARG_INPUT, ctx) => MODEL.findUniqueOrThrow({...query,where: WHERE_CLAUSE})`,
          {
            ARG_INPUT: `{ ${primaryKeyDefinition.name} }`,
            MODEL: prismaOutput.getPrismaModelExpression(modelName),
            WHERE_CLAUSE: `{ ${primaryKeyDefinition.name} }`,
          }
        );

        const options = {
          type: quot(modelName),
          ...customFields.value(),
          args: pothosArgs.expression,
          resolve: resolveFunction,
        };

        const block = TypescriptCodeUtils.formatBlock(
          `BUILDER.queryField(QUERY_NAME, (t) => 
          t.prismaField(OPTIONS)
        );`,
          {
            QUERY_EXPORT: `${lowerFirstModelName}Query`,
            BUILDER: 'builder',
            QUERY_NAME: quot(lowerFirstModelName),
            OPTIONS: TypescriptCodeUtils.mergeExpressionsAsObject(options),
          }
        );

        pothosTypesFile.registerType({
          category: 'find-query',
          block,
        });
      },
    };
  },
}));

const PothosPrismaFindQueryGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    authorize: {
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@baseplate/fastify/pothos/pothos-authorize-field',
      },
    },
  }),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default PothosPrismaFindQueryGenerator;
