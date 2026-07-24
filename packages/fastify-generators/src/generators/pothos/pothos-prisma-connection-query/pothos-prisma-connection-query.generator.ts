import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
} from '@baseplate-dev/sync';
import { quot, sortObjectKeys, uppercaseFirstChar } from '@baseplate-dev/utils';
import { pluralize } from 'inflection';
import { z } from 'zod';

import { pothosFieldProvider } from '#src/generators/pothos/_providers/pothos-field.js';
import { getModelIdFieldName } from '#src/generators/prisma/_shared/crud-method/primary-key-input.js';
import { prismaModelPolicyProvider } from '#src/generators/prisma/prisma-model-authorizer/index.js';
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
  /**
   * Model name key to look up the model policy provider. When set, the resolve
   * and totalCount functions filter with `policy.read.where(ctx)`.
   */
  policyRef: z.string().optional(),
});

export const pothosPrismaConnectionQueryGenerator = createGenerator({
  name: 'pothos/pothos-prisma-connection-query',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks: ({ modelName, order, policyRef }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        pothosTypesFile: pothosTypesFileProvider,
        modelPolicy: prismaModelPolicyProvider
          .dependency()
          .optionalReference(policyRef),
      },
      exports: {
        pothosField: pothosFieldProvider.export(pothosFieldScope),
      },
      run({ prismaOutput, pothosTypesFile, modelPolicy }) {
        const modelOutput = prismaOutput.getPrismaModel(modelName);

        const { idFields } = modelOutput;

        if (!idFields) {
          throw new Error(`Model ${modelName} does not have an ID field`);
        }

        const queryName = `${pluralize(lowerCaseFirst(modelName))}Connection`;
        const cursorFieldName = getModelIdFieldName(modelOutput);

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

            const resolveFunction: TsCodeFragment = modelPolicy
              ? tsTemplate`async (query, _root, _args, ctx) => ${prismaModelFragment}.findMany({ ...query, where: ${modelPolicy.getActionWhereFragment('read')}(ctx) })`
              : tsTemplate`async (query) => ${prismaModelFragment}.findMany({ ...query })`;

            const totalCountFunction: TsCodeFragment = modelPolicy
              ? tsTemplate`(_connection, _args, ctx) => ${prismaModelFragment}.count({ where: ${modelPolicy.getActionWhereFragment('read')}(ctx) })`
              : tsTemplate`() => ${prismaModelFragment}.count()`;

            const options = {
              type: quot(modelName),
              cursor: quot(cursorFieldName),
              ...sortObjectKeys(customFields.value()),
              totalCount: totalCountFunction,
              resolve: resolveFunction,
            };

            const block = tsTemplate`${pothosTypesFile.getBuilderFragment()}.queryField(
              ${quot(queryName)},
              (t) => t.prismaConnection(
                ${TsCodeUtils.mergeFragmentsAsObject(options, { disableSort: true })},
                { name: ${quot(`${uppercaseFirstChar(modelName)}Connection`)} },
                { name: ${quot(`${uppercaseFirstChar(modelName)}Edge`)} },
              )
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
