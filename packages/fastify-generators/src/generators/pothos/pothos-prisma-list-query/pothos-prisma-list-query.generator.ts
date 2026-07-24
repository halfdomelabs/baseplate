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
import { prismaModelPolicyProvider } from '#src/generators/prisma/prisma-model-authorizer/index.js';
import { prismaOutputProvider } from '#src/generators/prisma/prisma/index.js';
import { lowerCaseFirst } from '#src/utils/case.js';

import { pothosTypeOutputProvider } from '../_providers/index.js';
import { pothosFieldScope } from '../_providers/scopes.js';
import { pothosPrismaWhereComplexityValidatorProvider } from '../pothos-prisma-filters-file/index.js';
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
   * function filters with `policy.read.where(ctx)`.
   */
  policyRef: z.string().optional(),
  /**
   * Key to look up the model's WhereInput type output. When set, a `where`
   * arg is added and passed as the caller-supplied where clause.
   */
  whereInputRef: z.string().optional(),
});

export const pothosPrismaListQueryGenerator = createGenerator({
  name: 'pothos/pothos-prisma-list-query',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks: ({ modelName, order, policyRef, whereInputRef }) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaOutput: prismaOutputProvider,
        pothosTypesFile: pothosTypesFileProvider,
        modelPolicy: prismaModelPolicyProvider
          .dependency()
          .optionalReference(policyRef),
        whereInputType: pothosTypeOutputProvider
          .dependency()
          .optionalReference(whereInputRef),
        whereComplexityValidator: pothosPrismaWhereComplexityValidatorProvider
          .dependency()
          .optional(),
      },
      exports: {
        pothosField: pothosFieldProvider.export(pothosFieldScope),
      },
      run({
        prismaOutput,
        pothosTypesFile,
        modelPolicy,
        whereInputType,
        whereComplexityValidator,
      }) {
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

            const zFragment = TsCodeUtils.importFragment('z', 'zod');

            const argsPattern = whereInputType
              ? '{ skip, take, where }'
              : '{ skip, take }';
            const callerWhereArg = whereInputType ? ', where ?? undefined' : '';
            const noPolicyWhere = whereInputType
              ? 'where: where ?? undefined, '
              : '';

            const resolveFunction: TsCodeFragment = modelPolicy
              ? tsTemplate`async (query, _root, ${argsPattern}, ctx) => ${prismaModelFragment}.findMany({ ...query, where: ${modelPolicy.getActionWhereFragment('read')}(ctx${callerWhereArg}), skip: skip ?? undefined, take: take ?? undefined })`
              : tsTemplate`async (query, _root, ${argsPattern}) => ${prismaModelFragment}.findMany({ ...query, ${noPolicyWhere}skip: skip ?? undefined, take: take ?? undefined })`;

            const whereArgFragment =
              whereInputType && whereComplexityValidator
                ? tsTemplate`where: t.arg({
                    type: ${whereInputType.getTypeReference().fragment},
                    validate: ${zFragment}.custom((where) => ${whereComplexityValidator.getValidatorFragment()}(where, ${whereComplexityValidator.getMaxDepth().toString()}, ${whereComplexityValidator.getMaxClauseCount().toString()}), {
                      message: 'where filter is too deeply nested or has too many clauses',
                    }),
                  }),`
                : '';

            const options = {
              type: `[${quot(modelName)}]`,
              args: tsTemplate`{
                skip: t.arg.int({ validate: ${zFragment}.int().min(0) }),
                take: t.arg.int({ validate: ${zFragment}.int().min(0) }),
                ${whereArgFragment}
              }`,
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
              order,
            });
          },
        };
      },
    }),
  }),
});
