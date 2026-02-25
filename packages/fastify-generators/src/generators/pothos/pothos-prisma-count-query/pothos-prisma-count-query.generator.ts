import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
} from '@baseplate-dev/sync';
import { quot, sortObjectKeys } from '@baseplate-dev/utils';
import { pluralize } from 'inflection';
import { z } from 'zod';

import { pothosFieldProvider } from '#src/generators/pothos/_providers/pothos-field.js';
import { prismaOutputProvider } from '#src/generators/prisma/prisma/index.js';
import { lowerCaseFirst } from '#src/utils/case.js';

import { pothosFieldScope } from '../_providers/scopes.js';
import { pothosTypesFileProvider } from '../pothos-types-file/index.js';

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

export const pothosPrismaCountQueryGenerator = createGenerator({
  name: 'pothos/pothos-prisma-count-query',
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

        const queryName = `${pluralize(lowerCaseFirst(modelName))}Count`;

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

            const resolveFunction = tsTemplate`async () => ${prismaModelFragment}.count()`;

            const options = {
              ...sortObjectKeys(customFields.value()),
              resolve: resolveFunction,
            };

            const block = tsTemplate`${pothosTypesFile.getBuilderFragment()}.queryField(
              ${quot(queryName)},
              (t) => t.int(${TsCodeUtils.mergeFragmentsAsObject(options, { disableSort: true })})
            )`;

            pothosTypesFile.typeDefinitions.add({
              name: `${queryName}Query`,
              fragment: block,
              order,
            });
          },
        };
      },
    }),
  }),
});
