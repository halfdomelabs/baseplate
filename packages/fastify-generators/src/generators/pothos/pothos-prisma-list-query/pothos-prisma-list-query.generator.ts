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
import {
  buildOrderByValueFragment,
  buildTakeArgFragment,
  buildTakeValue,
  buildWhereArgFragment,
  defaultSortSchema,
  getCallerWhereArg,
  pageSizeSchema,
} from '#src/writers/pothos/index.js';

import { pothosTypeOutputProvider } from '../_providers/index.js';
import { pothosFieldScope } from '../_providers/scopes.js';
import { pothosPrismaWhereComplexityValidatorProvider } from '../pothos-prisma-filters-file/index.js';
import { pothosSortOrderProvider } from '../pothos-sort-order/index.js';
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
   * function filters with the policy's read action.
   */
  policyRef: z.string().optional(),
  /**
   * Key to look up the model's WhereInput type output. When set, a `where`
   * arg is added and passed as the caller-supplied where clause.
   */
  whereInputRef: z.string().optional(),
  /**
   * Key to look up the model's OrderByInput type output. When set, an
   * `orderBy` arg is added and passed as the caller-supplied sort order.
   */
  orderByInputRef: z.string().optional(),
  /**
   * Sort applied when the caller supplies no `orderBy`. Applies whether or not
   * an `orderBy` arg is exposed.
   */
  defaultSort: defaultSortSchema,
  ...pageSizeSchema,
});

export const pothosPrismaListQueryGenerator = createGenerator({
  name: 'pothos/pothos-prisma-list-query',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  scopes: [pothosFieldScope],
  buildTasks: ({
    modelName,
    order,
    policyRef,
    whereInputRef,
    orderByInputRef,
    defaultSort,
    defaultPageSize,
    maxPageSize,
  }) => ({
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
        orderByInputType: pothosTypeOutputProvider
          .dependency()
          .optionalReference(orderByInputRef),
        sortOrder: pothosSortOrderProvider.dependency().optional(),
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
        orderByInputType,
        sortOrder,
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

            const argNames = [
              'skip',
              'take',
              ...(whereInputType ? ['where'] : []),
              ...(orderByInputType ? ['orderBy'] : []),
            ];
            const argsPattern = `{ ${argNames.join(', ')} }`;
            const callerWhereArg = getCallerWhereArg(!!whereInputType);
            const noPolicyWhere = whereInputType
              ? 'where: where ?? undefined, '
              : '';
            const orderByValue = buildOrderByValueFragment({
              argExpression: orderByInputType ? 'orderBy' : undefined,
              applyStableOrderByFragment:
                sortOrder?.getApplyStableOrderByFragment(),
              idFieldNames: idFields,
              defaultSort,
            });
            const orderByFragment = orderByValue
              ? tsTemplate`orderBy: ${orderByValue}, `
              : '';

            const takeValue = buildTakeValue('take', defaultPageSize);

            const resolveFunction: TsCodeFragment = modelPolicy
              ? tsTemplate`async (query, _root, ${argsPattern}, ctx) => ${prismaModelFragment}.findMany({ ...query, where: ${modelPolicy.getActionWhereFragment('read')}(ctx${callerWhereArg}), ${orderByFragment}skip: skip ?? undefined, take: ${takeValue} })`
              : tsTemplate`async (query, _root, ${argsPattern}) => ${prismaModelFragment}.findMany({ ...query, ${noPolicyWhere}${orderByFragment}skip: skip ?? undefined, take: ${takeValue} })`;

            const argFragments: Record<string, TsCodeFragment> = {
              skip: tsTemplate`t.arg.int({ validate: ${zFragment}.int().min(0) })`,
              take: buildTakeArgFragment(maxPageSize),
              ...(whereInputType && whereComplexityValidator
                ? {
                    where: buildWhereArgFragment({
                      whereInputTypeReference:
                        whereInputType.getTypeReference().fragment,
                      validatorFragment:
                        whereComplexityValidator.getValidatorFragment(),
                      maxDepth: whereComplexityValidator.getMaxDepth(),
                      maxClauseCount:
                        whereComplexityValidator.getMaxClauseCount(),
                    }),
                  }
                : {}),
              ...(orderByInputType
                ? {
                    orderBy: tsTemplate`t.arg({ type: [${orderByInputType.getTypeReference().fragment}] })`,
                  }
                : {}),
            };

            const options = {
              type: `[${quot(modelName)}]`,
              args: TsCodeUtils.mergeFragmentsAsObject(argFragments, {
                disableSort: true,
              }),
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
