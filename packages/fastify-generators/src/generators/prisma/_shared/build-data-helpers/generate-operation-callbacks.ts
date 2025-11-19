import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { tsTemplate } from '@baseplate-dev/core-generators';

import type { PrismaOutputModel } from '#src/types/prisma-output.js';

import type { DataUtilsImportsProvider } from '../../data-utils/index.js';

import { generateRelationBuildData } from './generate-relation-build-data.js';

/**
 * Configuration for generating create operation callback
 */
export interface GenerateCreateCallbackConfig {
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
export interface GenerateCreateCallbackResult {
  /** Complete create callback fragment: ({ tx, data, query }) => tx.model.create({...}) */
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
 * // Returns: ({ tx, data, query }) => tx.user.create({ data, ...query })
 *
 * @example
 * // With relations
 * generateCreateCallback({...})
 * // Returns: ({ tx, data, query }) =>
 * //   tx.todoItem.create({
 * //     data: {
 * //       ...data,
 * //       assignee: relationHelpers.connectCreate({ id: data.assigneeId }),
 * //       todoList: relationHelpers.connectCreate({ id: data.todoListId }),
 * //     },
 * //     ...query,
 * //   })
 */
export function generateCreateCallback(
  config: GenerateCreateCallbackConfig,
): GenerateCreateCallbackResult {
  const { prismaModel, inputFieldNames, dataUtilsImports, modelVariableName } =
    config;

  const { argumentFragment, returnFragment, passthrough } =
    generateRelationBuildData({
      prismaModel,
      inputFieldNames,
      operationType: 'create',
      dataUtilsImports,
    });

  if (passthrough) {
    return {
      createCallbackFragment: tsTemplate`
        ({ tx, data, query }) =>
          tx.${modelVariableName}.create({
            data,
            ...query,
          })
      `,
    };
  }

  return {
    createCallbackFragment: tsTemplate`
      ({ tx, data: ${argumentFragment}, query }) =>
        tx.${modelVariableName}.create({
          data: ${returnFragment},
          ...query,
        })
    `,
  };
}

/**
 * Configuration for generating update operation callback
 */
export interface GenerateUpdateCallbackConfig {
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
export interface GenerateUpdateCallbackResult {
  /** Complete update callback fragment: ({ tx, where, data, query }) => tx.model.update({...}) */
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
 * // Returns: ({ tx, where, data, query }) => tx.user.update({ where, data, ...query })
 *
 * @example
 * // With relations
 * generateUpdateCallback({...})
 * // Returns: ({ tx, where, data, query }) =>
 * //   tx.todoItem.update({
 * //     where,
 * //     data: {
 * //       ...data,
 * //       assignee: relationHelpers.connectUpdate({ id: data.assigneeId }),
 * //       todoList: relationHelpers.connectUpdate({ id: data.todoListId }),
 * //     },
 * //     ...query,
 * //   })
 */
export function generateUpdateCallback(
  config: GenerateUpdateCallbackConfig,
): GenerateUpdateCallbackResult {
  const { prismaModel, inputFieldNames, dataUtilsImports, modelVariableName } =
    config;

  const { argumentFragment, returnFragment, passthrough } =
    generateRelationBuildData({
      prismaModel,
      inputFieldNames,
      operationType: 'update',
      dataUtilsImports,
    });

  if (passthrough) {
    return {
      updateCallbackFragment: tsTemplate`
        ({ tx, where, data, query }) =>
          tx.${modelVariableName}.update({
            where,
            data,
            ...query,
          })
      `,
    };
  }

  return {
    updateCallbackFragment: tsTemplate`
      ({ tx, where, data: ${argumentFragment}, query }) =>
        tx.${modelVariableName}.update({
          where,
          data: ${returnFragment},
          ...query,
        })
    `,
  };
}

/**
 * Configuration for generating delete operation callback
 */
export interface GenerateDeleteCallbackConfig {
  /** Prisma model variable name in camelCase (e.g., 'todoItem', 'user') */
  modelVariableName: string;
}

/**
 * Result of generating delete operation callback
 */
export interface GenerateDeleteCallbackResult {
  /** Complete delete callback fragment: ({ tx, where, query }) => tx.model.delete({...}) */
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
 * // Returns: ({ tx, where, query }) => tx.todoItem.delete({ where, ...query })
 */
export function generateDeleteCallback(
  config: GenerateDeleteCallbackConfig,
): GenerateDeleteCallbackResult {
  const { modelVariableName } = config;

  return {
    deleteCallbackFragment: tsTemplate`
      ({ tx, where, query }) =>
        tx.${modelVariableName}.delete({
          where,
          ...query,
        })
    `,
  };
}
