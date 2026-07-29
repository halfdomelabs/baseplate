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
import {
  buildOrderByValueFragment,
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
   * and totalCount functions filter with the policy's read action.
   */
  policyRef: z.string().optional(),
  /**
   * Key to look up the model's WhereInput type output. When set, a `where`
   * arg is added and passed as the caller-supplied where clause to both the
   * resolve and totalCount functions.
   */
  whereInputRef: z.string().optional(),
  /**
   * Key to look up the model's OrderByInput type output. When set, an
   * `orderBy` arg is added and passed as the caller-supplied sort order to
   * the resolve function (not totalCount, since ordering is meaningless for
   * a count). The model's ID field(s) are appended as a stable tiebreaker so
   * cursor pagination doesn't skip or repeat rows when the sort has ties.
   */
  orderByInputRef: z.string().optional(),
  /**
   * Sort applied when the caller supplies no `orderBy`. Applies whether or not
   * an `orderBy` arg is exposed.
   */
  defaultSort: defaultSortSchema,
  ...pageSizeSchema,
});

export const pothosPrismaConnectionQueryGenerator = createGenerator({
  name: 'pothos/pothos-prisma-connection-query',
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

            // totalCount is a `.count()` call — ordering is meaningless there,
            // so its arg pattern never includes `orderBy` even when the
            // resolve function's does.
            const totalCountArgsPattern = whereInputType ? '{ where }' : '{}';
            const resolveArgNames = [
              ...(whereInputType ? ['where'] : []),
              ...(orderByInputType ? ['orderBy'] : []),
            ];
            const resolveArgsPattern =
              resolveArgNames.length > 0
                ? `{ ${resolveArgNames.join(', ')} }`
                : '{}';
            const callerWhereArg = getCallerWhereArg(!!whereInputType);
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

            const resolveFunction: TsCodeFragment = modelPolicy
              ? tsTemplate`async (query, _root, ${resolveArgsPattern}, ctx) => ${prismaModelFragment}.findMany({ ...query, where: ${modelPolicy.getActionWhereFragment('read')}(ctx${callerWhereArg}), ${orderByFragment} })`
              : whereInputType
                ? tsTemplate`async (query, _root, ${resolveArgsPattern}) => ${prismaModelFragment}.findMany({ ...query, where: where ?? undefined, ${orderByFragment} })`
                : orderByInputType
                  ? tsTemplate`async (query, _root, ${resolveArgsPattern}) => ${prismaModelFragment}.findMany({ ...query, ${orderByFragment} })`
                  : tsTemplate`async (query) => ${prismaModelFragment}.findMany({ ...query, ${orderByFragment} })`;

            const totalCountFunction: TsCodeFragment = modelPolicy
              ? tsTemplate`(_connection, ${totalCountArgsPattern}, ctx) => ${prismaModelFragment}.count({ where: ${modelPolicy.getActionWhereFragment('read')}(ctx${callerWhereArg}) })`
              : whereInputType
                ? tsTemplate`(_connection, ${totalCountArgsPattern}) => ${prismaModelFragment}.count({ where: where ?? undefined })`
                : tsTemplate`() => ${prismaModelFragment}.count()`;

            const argFragments: Record<string, TsCodeFragment> = {
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
            const hasArgs = Object.keys(argFragments).length > 0;

            const options = {
              type: quot(modelName),
              cursor: quot(cursorFieldName),
              // Omitted when unset so the relay plugin's own defaults apply.
              ...(defaultPageSize === undefined
                ? {}
                : { defaultSize: defaultPageSize.toString() }),
              ...(maxPageSize === undefined
                ? {}
                : { maxSize: maxPageSize.toString() }),
              ...(hasArgs
                ? {
                    args: TsCodeUtils.mergeFragmentsAsObject(argFragments, {
                      disableSort: true,
                    }),
                  }
                : {}),
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
