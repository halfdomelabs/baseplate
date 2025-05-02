import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import { TsCodeUtils, tsTemplate } from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
} from '@halfdomelabs/sync';
import { quot, sortObjectKeys } from '@halfdomelabs/utils';
import { pluralize } from 'inflection';
import { z } from 'zod';

import { pothosFieldProvider } from '@src/generators/pothos/_providers/pothos-field.js';
import { prismaOutputProvider } from '@src/generators/prisma/prisma/prisma.generator.js';
import { lowerCaseFirst } from '@src/utils/case.js';

import { pothosFieldScope } from '../_providers/scopes.js';
import { pothosTypesFileProvider } from '../pothos-types-file/pothos-types-file.generator.js';

const descriptorSchema = z.object({
  /**
   * The name of the model.
   */
  modelName: z.string().min(1),
  /**
   * The order of the type in the types file.
   */
  order: z.number(),
});

export const pothosPrismaListQueryGenerator = createGenerator({
  name: 'pothos/pothos-prisma-list-query',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks: ({ modelName, order }) => ({
    main: createGeneratorTask({
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
          Record<string, TsCodeFragment>
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
            const prismaModelFragment =
              prismaOutput.getPrismaModelFragment(modelName);

            const resolveFunction = tsTemplate`async (query) => ${prismaModelFragment}.findMany({ ...query })`;

            const options = {
              type: `[${quot(modelName)}]`,
              ...sortObjectKeys(customFields.value()),
              resolve: resolveFunction,
            };

            const block = tsTemplate`${pothosTypesFile.getBuilderFragment()}.queryField(
              ${quot(queryName)},
              (t) => t.prismaField(${TsCodeUtils.mergeFragmentsAsObject(options, { disableSort: true })})
            )`;

            pothosTypesFile.typeDefinitions.add({
              name: `${queryName}Query`,
              fragment: block,
              dependencies: [],
              order,
            });
          },
        };
      },
    }),
  }),
});
