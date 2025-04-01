import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';

import { quot, TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGenerator, createNonOverwriteableMap } from '@halfdomelabs/sync';
import { pluralize } from 'inflection';
import { z } from 'zod';

import { prismaOutputProvider } from '@src/generators/prisma/prisma/index.js';
import { pothosFieldProvider } from '@src/providers/pothos-field.js';
import { lowerCaseFirst } from '@src/utils/case.js';

import { pothosTypesFileProvider } from '../pothos-types-file/index.js';
import { pothosFieldScope } from '../providers/scopes.js';

const descriptorSchema = z.object({
  modelName: z.string().min(1),
});

export const pothosPrismaListQueryGenerator = createGenerator({
  name: 'pothos/pothos-prisma-list-query',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks(taskBuilder, { modelName }) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        prismaOutput: prismaOutputProvider,
        pothosTypesFile: pothosTypesFileProvider,
      },
      exports: {
        pothosField: pothosFieldProvider.export(pothosFieldScope),
      },
      run({ prismaOutput, pothosTypesFile }) {
        const modelOutput = prismaOutput.getPrismaModel(modelName);

        const { idFields } = modelOutput;

        if (!idFields) {
          throw new Error(`Model ${modelName} does not have an ID field`);
        }

        const queryName = pluralize(lowerCaseFirst(modelName));

        const customFields = createNonOverwriteableMap<
          Record<string, TypescriptCodeExpression>
        >({});

        return {
          providers: {
            pothosField: {
              addCustomOption(field) {
                customFields.set(field.name, field.value);
              },
            },
          },
          build: () => {
            const resolveFunction = TypescriptCodeUtils.formatExpression(
              `async (query) => MODEL.findMany({ ...query })`,
              {
                MODEL: prismaOutput.getPrismaModelExpression(modelName),
              },
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
              },
            );

            pothosTypesFile.registerType({
              category: 'list-query',
              block,
            });
          },
        };
      },
    });
  },
});
