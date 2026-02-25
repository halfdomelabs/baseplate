import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { tsTemplate } from '@baseplate-dev/core-generators';

import type { PrismaOutputModel } from '#src/types/prisma-output.js';

import type { DataUtilsImportsProvider } from '../../data-utils/index.js';

import { generateRelationBuildData } from './generate-relation-build-data.js';

/**
 * Configuration for generating create/update execute callbacks
 */
interface GenerateExecuteCallbackConfig {
  /** Prisma model to analyze for relations */
  prismaModel: PrismaOutputModel;
  /** Field names that are included in the input */
  inputFieldNames: string[];
  /** Data utils imports provider for accessing relationHelpers fragments */
  dataUtilsImports: DataUtilsImportsProvider;
  /** Prisma model variable name in camelCase (e.g., 'todoItem', 'user') */
  modelVariableName: string;
}

/**
 * Result of generating create execute callback
 */
interface GenerateCreateExecuteCallbackResult {
  /** Execute callback fragment: async ({ tx, data, query }) => tx.model.create({ data, ...query }) */
  executeCallbackFragment: TsCodeFragment;
}

/**
 * Generates a create execute callback that transforms foreign key fields into Prisma relation objects.
 *
 * @param config - Configuration including Prisma model, input fields, and model name
 * @returns Result containing the execute callback function fragment
 *
 * @example
 * // No relations
 * generateCreateExecuteCallback({...})
 * // Returns: async ({ tx, data, query }) => {
 * //   const item = await tx.user.create({ data, ...query });
 * //   return item;
 * // }
 *
 * @example
 * // With relations
 * generateCreateExecuteCallback({...})
 * // Returns: async ({ tx, data: { assigneeId, todoListId, ...rest }, query }) => {
 * //   const item = await tx.todoItem.create({
 * //     data: {
 * //       ...rest,
 * //       assignee: relationHelpers.connectCreate({ id: assigneeId }),
 * //       todoList: relationHelpers.connectCreate({ id: todoListId }),
 * //     },
 * //     ...query,
 * //   });
 * //   return item;
 * // }
 */
export function generateCreateExecuteCallback(
  config: GenerateExecuteCallbackConfig,
): GenerateCreateExecuteCallbackResult {
  const { prismaModel, inputFieldNames, dataUtilsImports, modelVariableName } =
    config;

  const {
    createArgumentFragment: argumentFragment,
    createReturnFragment: returnFragment,
    passthrough,
  } = generateRelationBuildData({
    prismaModel,
    inputFieldNames,
    dataUtilsImports,
    dataName: 'rest',
  });

  if (passthrough) {
    return {
      executeCallbackFragment: tsTemplate`
        async ({ tx, data, query }) => {
          const item = await tx.${modelVariableName}.create({
            data,
            ...query,
          });
          return item;
        }
      `,
    };
  }

  return {
    executeCallbackFragment: tsTemplate`
      async ({ tx, data: ${argumentFragment}, query }) => {
        const item = await tx.${modelVariableName}.create({
          data: ${returnFragment},
          ...query,
        });
        return item;
      }
    `,
  };
}

/**
 * Result of generating update execute callback
 */
interface GenerateUpdateExecuteCallbackResult {
  /** Execute callback fragment: async ({ tx, data, query }) => tx.model.update({ where, data, ...query }) */
  executeCallbackFragment: TsCodeFragment;
}

/**
 * Generates an update execute callback that transforms foreign key fields into Prisma relation objects.
 *
 * The `where` clause is captured from the enclosing function scope rather than
 * passed as a callback argument.
 *
 * @param config - Configuration including Prisma model, input fields, and model name
 * @returns Result containing the execute callback function fragment
 *
 * @example
 * // No relations
 * generateUpdateExecuteCallback({...})
 * // Returns: async ({ tx, data, query }) => {
 * //   const item = await tx.user.update({ where, data, ...query });
 * //   return item;
 * // }
 *
 * @example
 * // With relations
 * generateUpdateExecuteCallback({...})
 * // Returns: async ({ tx, data: { assigneeId, todoListId, ...rest }, query }) => {
 * //   const item = await tx.todoItem.update({
 * //     where,
 * //     data: {
 * //       ...rest,
 * //       assignee: relationHelpers.connectUpdate({ id: assigneeId }),
 * //       todoList: relationHelpers.connectUpdate({ id: todoListId }),
 * //     },
 * //     ...query,
 * //   });
 * //   return item;
 * // }
 */
export function generateUpdateExecuteCallback(
  config: GenerateExecuteCallbackConfig,
): GenerateUpdateExecuteCallbackResult {
  const { prismaModel, inputFieldNames, dataUtilsImports, modelVariableName } =
    config;

  const {
    updateArgumentFragment: argumentFragment,
    updateReturnFragment: returnFragment,
    passthrough,
  } = generateRelationBuildData({
    prismaModel,
    inputFieldNames,
    dataUtilsImports,
    dataName: 'rest',
  });

  if (passthrough) {
    return {
      executeCallbackFragment: tsTemplate`
        async ({ tx, data, query }) => {
          const item = await tx.${modelVariableName}.update({
            where,
            data,
            ...query,
          });
          return item;
        }
      `,
    };
  }

  return {
    executeCallbackFragment: tsTemplate`
      async ({ tx, data: ${argumentFragment}, query }) => {
        const item = await tx.${modelVariableName}.update({
          where,
          data: ${returnFragment},
          ...query,
        });
        return item;
      }
    `,
  };
}

/**
 * Configuration for generating delete execute callback
 */
interface GenerateDeleteExecuteCallbackConfig {
  /** Prisma model variable name in camelCase (e.g., 'todoItem', 'user') */
  modelVariableName: string;
}

/**
 * Result of generating delete execute callback
 */
interface GenerateDeleteExecuteCallbackResult {
  /** Execute callback fragment: async ({ tx, query }) => { const item = await tx.model.delete({ where, ...query }); return item; } */
  executeCallbackFragment: TsCodeFragment;
}

/**
 * Generates a delete execute callback.
 *
 * Delete operations don't need data transformation, so this simply generates
 * a callback that deletes the record. The `where` clause is captured from the
 * enclosing function scope rather than passed as a callback argument.
 *
 * @param config - Configuration with model name
 * @returns Result containing the execute callback function fragment
 *
 * @example
 * generateDeleteExecuteCallback({ modelVariableName: 'todoItem' })
 * // Returns: async ({ tx, query }) => {
 * //   const item = await tx.todoItem.delete({ where, ...query });
 * //   return item;
 * // }
 */
export function generateDeleteExecuteCallback(
  config: GenerateDeleteExecuteCallbackConfig,
): GenerateDeleteExecuteCallbackResult {
  const { modelVariableName } = config;

  return {
    executeCallbackFragment: tsTemplate`
      async ({ tx, query }) => {
        const item = await tx.${modelVariableName}.delete({
          where,
          ...query,
        });
        return item;
      }
    `,
  };
}
