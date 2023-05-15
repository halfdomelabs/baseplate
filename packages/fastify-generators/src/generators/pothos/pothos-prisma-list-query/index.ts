import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import inflection from 'inflection';
import { z } from 'zod';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { pothosFieldProvider } from '@src/providers/pothos-field';
import { lowerCaseFirst } from '@src/utils/case';
import { quot } from '@src/utils/string';
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
  },
  exports: {
    pothosField: pothosFieldProvider,
  },
  run({ prismaOutput, pothosTypesFile }) {
    const modelOutput = prismaOutput.getPrismaModel(modelName);

    const { idFields } = modelOutput;

    if (!idFields) {
      throw new Error(`Model ${modelName} does not have an ID field`);
    }

    const queryName = inflection.pluralize(lowerCaseFirst(modelName));

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
        const resolveFunction = TypescriptCodeUtils.formatExpression(
          `async (query) => MODEL.findMany({ ...query })`,
          {
            MODEL: prismaOutput.getPrismaModelExpression(modelName),
          }
        );

        const options = {
          type: `[${quot(modelName)}]`,
          ...customFields.value(),
          resolve: resolveFunction,
        };

        const block = TypescriptCodeUtils.formatBlock(
          `BUILDER.queryField(QUERY_NAME, (t) => 
          t.prismaField(OPTIONS)
        );`,
          {
            QUERY_EXPORT: `${queryName}Query`,
            BUILDER: 'builder',
            QUERY_NAME: quot(queryName),
            OPTIONS: TypescriptCodeUtils.mergeExpressionsAsObject(options),
          }
        );

        pothosTypesFile.registerType({
          category: 'list-query',
          block,
        });
      },
    };
  },
}));

const PothosPrismaListQueryGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    authorize: {
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@halfdomelabs/fastify/pothos/pothos-authorize-field',
      },
    },
  }),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default PothosPrismaListQueryGenerator;
