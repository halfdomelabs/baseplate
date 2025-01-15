import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';

import { quot, TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createNonOverwriteableMap,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import type { PothosWriterOptions } from '@src/writers/pothos/index.js';

import {
  getModelIdFieldName,
  getPrimaryKeyDefinition,
} from '@src/generators/prisma/_shared/crud-method/primary-key-input.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import { pothosFieldProvider } from '@src/providers/pothos-field.js';
import { lowerCaseFirst } from '@src/utils/case.js';
import { writePothosArgsFromDtoFields } from '@src/writers/pothos/index.js';

import { pothosTypesFileProvider } from '../pothos-types-file/index.js';
import { pothosSchemaProvider } from '../pothos/index.js';
import { pothosFieldScope } from '../providers/scopes.js';

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
    pothosField: pothosFieldProvider.export(pothosFieldScope),
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
          writerOptions,
        );

        if (pothosArgs.childDefinitions)
          for (const child of pothosArgs.childDefinitions) {
            pothosTypesFile.registerType({
              name: child.name,
              block: child.definition,
            });
          }

        const primaryKeyFieldName = getModelIdFieldName(modelOutput);

        const resolveFunction = TypescriptCodeUtils.formatExpression(
          `async (query, root, ARG_INPUT) => MODEL.findUniqueOrThrow({...query,where: WHERE_CLAUSE})`,
          {
            ARG_INPUT: `{ ${primaryKeyDefinition.name} }`,
            MODEL: prismaOutput.getPrismaModelExpression(modelName),
            WHERE_CLAUSE:
              primaryKeyFieldName === primaryKeyDefinition.name
                ? `{ ${primaryKeyFieldName} }`
                : `{ ${primaryKeyFieldName}: ${primaryKeyDefinition.name} }`,
          },
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
          },
        );

        pothosTypesFile.registerType({
          category: 'find-query',
          block,
        });
      },
    };
  },
}));

export const pothosPrismaFindQueryGenerator = createGenerator({
  name: 'pothos/pothos-prisma-find-query',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});
