import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { tsTemplate } from '@baseplate-dev/core-generators';

import type { PrismaOutputModel } from '#src/types/prisma-output.js';

import type { DataUtilsImportsProvider } from '../../data-utils/index.js';

import { generateRelationBuildData } from './generate-relation-build-data.js';

/**
 * Configuration for generating create operation callback
 */
interface GenerateCreateCallbackConfig {
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
 * Result of generating create operation callback
 */
interface GenerateCreateCallbackResult {
  /** Complete create callback fragment: async ({ tx, data, query }) => { const item = await tx.model.create({...}); return item; } */
  createCallbackFragment: TsCodeFragment;
}

/**
 * Generates a create operation callback that transforms foreign key fields into Prisma relation objects
 *
 * @param config - Configuration including Prisma model, input fields, and model name
 * @returns Result containing the create callback function fragment
 *
 * @example
 * // No relations
 * generateCreateCallback({...})
 * // Returns: async ({ tx, data, query }) => {
 * //   const item = await tx.user.create({ data, ...query });
 * //   return item;
 * // }
 *
 * @example
 * // With relations
 * generateCreateCallback({...})
 * // Returns: async ({ tx, data: { assigneeId, todoListId, ...data }, query }) => {
 * //   const item = await tx.todoItem.create({
 * //     data: {
 * //       ...data,
 * //       assignee: relationHelpers.connectCreate({ id: assigneeId }),
 * //       todoList: relationHelpers.connectCreate({ id: todoListId }),
 * //     },
 * //     ...query,
 * //   });
 * //   return item;
 * // }
 */
export function generateCreateCallback(
  config: GenerateCreateCallbackConfig,
): GenerateCreateCallbackResult {
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
  });

  if (passthrough) {
    return {
      createCallbackFragment: tsTemplate`
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
    createCallbackFragment: tsTemplate`
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
 * Configuration for generating update operation callback
 */
interface GenerateUpdateCallbackConfig {
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
 * Result of generating update operation callback
 */
interface GenerateUpdateCallbackResult {
  /** Complete update callback fragment: async ({ tx, where, data, query }) => { const item = await tx.model.update({...}); return item; } */
  updateCallbackFragment: TsCodeFragment;
}

/**
 * Generates an update operation callback that transforms foreign key fields into Prisma relation objects
 *
 * @param config - Configuration including Prisma model, input fields, and model name
 * @returns Result containing the update callback function fragment
 *
 * @example
 * // No relations
 * generateUpdateCallback({...})
 * // Returns: async ({ tx, where, data, query }) => {
 * //   const item = await tx.user.update({ where, data, ...query });
 * //   return item;
 * // }
 *
 * @example
 * // With relations
 * generateUpdateCallback({...})
 * // Returns: async ({ tx, where, data: { assigneeId, todoListId, ...data }, query }) => {
 * //   const item = await tx.todoItem.update({
 * //     where,
 * //     data: {
 * //       ...data,
 * //       assignee: relationHelpers.connectUpdate({ id: assigneeId }),
 * //       todoList: relationHelpers.connectUpdate({ id: todoListId }),
 * //     },
 * //     ...query,
 * //   });
 * //   return item;
 * // }
 */
export function generateUpdateCallback(
  config: GenerateUpdateCallbackConfig,
): GenerateUpdateCallbackResult {
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
  });

  if (passthrough) {
    return {
      updateCallbackFragment: tsTemplate`
        async ({ tx, where, data, query }) => {
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
    updateCallbackFragment: tsTemplate`
      async ({ tx, where, data: ${argumentFragment}, query }) => {
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
 * Configuration for generating delete operation callback
 */
interface GenerateDeleteCallbackConfig {
  /** Prisma model variable name in camelCase (e.g., 'todoItem', 'user') */
  modelVariableName: string;
}

/**
 * Result of generating delete operation callback
 */
interface GenerateDeleteCallbackResult {
  /** Complete delete callback fragment: async ({ tx, where, query }) => { const item = await tx.model.delete({...}); return item; } */
  deleteCallbackFragment: TsCodeFragment;
}

/**
 * Generates a delete operation callback
 *
 * Delete operations don't need data transformation, so this simply generates
 * a callback that passes through the where clause and query parameters.
 *
 * @param config - Configuration with model name
 * @returns Result containing the delete callback function fragment
 *
 * @example
 * generateDeleteCallback({ modelVariableName: 'todoItem' })
 * // Returns: async ({ tx, where, query }) => {
 * //   const item = await tx.todoItem.delete({ where, ...query });
 * //   return item;
 * // }
 */
export function generateDeleteCallback(
  config: GenerateDeleteCallbackConfig,
): GenerateDeleteCallbackResult {
  const { modelVariableName } = config;

  return {
    deleteCallbackFragment: tsTemplate`
      async ({ tx, where, query }) => {
        const item = await tx.${modelVariableName}.delete({
          where,
          ...query,
        });
        return item;
      }
    `,
  };
}
