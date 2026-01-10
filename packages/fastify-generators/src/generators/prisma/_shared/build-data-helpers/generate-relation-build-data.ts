import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';

import type {
  PrismaOutputModel,
  PrismaOutputRelationField,
} from '#src/types/prisma-output.js';

import type { DataUtilsImportsProvider } from '../../data-utils/index.js';

/**
 * Configuration for generating relation buildData functions
 */
interface GenerateRelationBuildDataConfig {
  /** Prisma model to analyze for relations */
  prismaModel: PrismaOutputModel;
  /** Field names that are included in the input (to determine which relations to include) */
  inputFieldNames: string[];
  /** Data utils imports provider for accessing relationHelpers fragments */
  dataUtilsImports: DataUtilsImportsProvider;
}

/**
 * Result of generating relation buildData functions
 */
interface GenerateRelationBuildDataResult {
  /** Create operation: argument pattern (e.g., "{ ownerId, ...data }") */
  createArgumentFragment: TsCodeFragment;
  /** Create operation: return value (e.g., "{ ...data, owner: relationHelpers.connectCreate(...) }") */
  createReturnFragment: TsCodeFragment;
  /** Update operation: argument pattern (e.g., "{ ownerId, ...data }") */
  updateArgumentFragment: TsCodeFragment;
  /** Update operation: return value (e.g., "{ ...data, owner: relationHelpers.connectUpdate(...) }") */
  updateReturnFragment: TsCodeFragment;
  /** buildCreateData function fragment: ({ fk1, fk2, ...data }) => ({ ...data, relation1: relationHelpers.connectCreate(...) }) */
  buildCreateDataFragment: TsCodeFragment;
  /** buildUpdateData function fragment: ({ fk1, fk2, ...data }) => ({ ...data, relation1: relationHelpers.connectUpdate(...) }) */
  buildUpdateDataFragment: TsCodeFragment;
  /** Whether this is a simple passthrough (no relations to transform) */
  passthrough: boolean;
}

/**
 * Generates a TypeScript code fragment for a unique where object
 *
 * @param foreignKeyFields - Array of foreign key field names (e.g., ['ownerId'] or ['userId', 'tenantId'])
 * @param referencedFields - Array of referenced field names in target model (e.g., ['id'] or ['id', 'tenantId'])
 * @returns TypeScript code fragment for the where object
 *
 * @example
 * // Single field
 * generateUniqueWhereFragment(['ownerId'], ['id']) => { id: ownerId }
 *
 * @example
 * // Composite key
 * generateUniqueWhereFragment(['userId', 'tenantId'], ['id', 'tenantId']) => { id: userId, tenantId }
 */
function generateUniqueWhereFragment(
  foreignKeyFields: string[],
  referencedFields: string[],
): TsCodeFragment {
  if (foreignKeyFields.length !== referencedFields.length) {
    throw new Error(
      `Foreign key fields and referenced fields must have the same length. Got ${foreignKeyFields.length} and ${referencedFields.length}`,
    );
  }

  return TsCodeUtils.mergeFragmentsAsObject(
    Object.fromEntries(
      foreignKeyFields.map((fkField, index) => [
        referencedFields[index],
        fkField,
      ]),
    ),
  );
}

/**
 * Finds all relations in the Prisma model that should be included based on input fields
 */
function findRelevantRelations(
  prismaModel: PrismaOutputModel,
  inputFieldNames: string[],
): PrismaOutputRelationField[] {
  const relevantRelations = prismaModel.fields.filter(
    (field): field is PrismaOutputRelationField =>
      field.type === 'relation' &&
      !!field.fields &&
      // Include relation if at least one of its foreign key fields is in the input
      field.fields.some((fkField) => inputFieldNames.includes(fkField)),
  );

  for (const relation of relevantRelations) {
    const missingFields = relation.fields?.filter(
      (fkField) => !inputFieldNames.includes(fkField),
    );
    if (missingFields?.length) {
      throw new Error(
        `Relation ${relation.name} requires all fields as inputs (missing ${missingFields.join(', ')})`,
      );
    }
  }

  return relevantRelations;
}

/**
 * Extracts all unique foreign key field names from relations
 */
function extractForeignKeyFields(
  relations: PrismaOutputRelationField[],
): string[] {
  const allFkFields = relations.flatMap((rel) => rel.fields ?? []);
  // Remove duplicates (though this should rarely happen)
  return [...new Set(allFkFields)];
}

/**
 * Generates a relation helper call fragment for a single relation
 *
 * @param relation - Prisma relation field metadata
 * @param operationType - Whether this is a create or update operation
 * @param relationHelpersFragment - Code fragment for accessing relationHelpers
 * @returns TypeScript code fragment for the relation helper call
 *
 * @example
 * // Single field, create operation
 * generateRelationHelperCall(...) => relationHelpers.connectCreate({ id: ownerId })
 *
 * @example
 * // Composite key, update operation
 * generateRelationHelperCall(...) => relationHelpers.connectUpdate({ id: userId, tenantId })
 */
function generateRelationHelperCall(
  relation: PrismaOutputRelationField,
  operationType: 'create' | 'update',
  relationHelpersFragment: TsCodeFragment,
): TsCodeFragment {
  const helperMethod =
    operationType === 'create' ? 'connectCreate' : 'connectUpdate';
  const uniqueWhere = generateUniqueWhereFragment(
    relation.fields ?? [],
    relation.references ?? [],
  );

  return tsTemplate`${relationHelpersFragment}.${helperMethod}(${uniqueWhere})`;
}

/**
 * Generates the complete buildData function fragment
 *
 * @example
 * // With foreign keys
 * generateBuildDataFunction(['ownerId'], [...]) => ({ ownerId, ...data }) => ({ ...data, owner: ... })
 *
 * @example
 * // No foreign keys (pass-through)
 * generateBuildDataFunction([], []) => (data) => data
 *
 * @example
 * // All fields are foreign keys (no spread)
 * generateBuildDataFunction(['ownerId', 'assigneeId'], [...], ['ownerId', 'assigneeId']) =>
 *   ({ ownerId, assigneeId }) => ({ owner: ..., assignee: ... })
 */
function generateBuildDataBody(
  foreignKeyFields: string[],
  operationType: 'create' | 'update',
  dataUtilsImports: DataUtilsImportsProvider,
  relevantRelations: PrismaOutputRelationField[],
  allInputFieldNames?: string[],
  dataName = 'data',
): {
  argumentFragment: TsCodeFragment;
  returnFragment: TsCodeFragment;
  passthrough: boolean;
} {
  if (relevantRelations.length === 0) {
    return {
      argumentFragment: tsTemplate`${dataName}`,
      returnFragment: tsTemplate`${dataName}`,
      passthrough: true,
    };
  }

  const relationHelpersFragment = dataUtilsImports.relationHelpers.fragment();
  const relationFragments = relevantRelations.map((relation) => ({
    relationName: relation.name,
    fragment: generateRelationHelperCall(
      relation,
      operationType,
      relationHelpersFragment,
    ),
  }));

  const sortedForeignKeyFields = foreignKeyFields.toSorted();

  // Determine if we need to spread remaining data
  const allFieldsAreForeignKeys = allInputFieldNames?.every((field) =>
    foreignKeyFields.includes(field),
  );

  // Build function parameter: ({ fk1, fk2, ...data }) or ({ fk1, fk2 })
  const paramPattern = allFieldsAreForeignKeys
    ? `{ ${sortedForeignKeyFields.join(', ')} }`
    : `{ ${sortedForeignKeyFields.join(', ')}, ...${dataName} }`;

  // Build return object using mergeFragmentsAsObject
  const returnObjectFragments: Record<string, TsCodeFragment> = {};

  // Add spread for remaining data if not all fields are foreign keys
  if (!allFieldsAreForeignKeys) {
    returnObjectFragments[`...${dataName}`] = tsTemplate`${dataName}`;
  }

  // Add relation fragments
  const sortedRelationFragments = relationFragments.toSorted();
  for (const { relationName, fragment } of sortedRelationFragments) {
    returnObjectFragments[relationName] = fragment;
  }

  // Disable sorting when we have a spread key
  const returnObject = TsCodeUtils.mergeFragmentsAsObject(
    returnObjectFragments,
    { disableSort: !allFieldsAreForeignKeys },
  );

  return {
    argumentFragment: tsTemplate`${paramPattern}`,
    returnFragment: returnObject,
    passthrough: false,
  };
}

/**
 * Generates separate buildCreateData and buildUpdateData functions that transform
 * foreign key fields into Prisma relation objects.
 *
 * This helper analyzes a Prisma model to find relations whose foreign key fields are included
 * in the input, then generates two separate functions for create and update operations.
 * Each function destructures the FK fields and uses relationHelpers to build the appropriate
 * Prisma connect objects.
 *
 * @param config - Configuration including Prisma model, input fields, and data utils imports
 * @returns Result containing buildCreateDataFragment and buildUpdateDataFragment
 *
 * @example
 * // Single relation
 * generateRelationBuildData({
 *   prismaModel: { fields: [...] },
 *   inputFieldNames: ['name', 'ownerId'],
 *   dataUtilsImports,
 * })
 * // Returns:
 * // buildCreateDataFragment: ({ ownerId, ...data }) => ({ ...data, owner: relationHelpers.connectCreate({ id: ownerId }) })
 * // buildUpdateDataFragment: ({ ownerId, ...data }) => ({ ...data, owner: relationHelpers.connectUpdate({ id: ownerId }) })
 *
 * @example
 * // No relations (pass-through)
 * generateRelationBuildData({
 *   prismaModel: { fields: [...] },
 *   inputFieldNames: ['name', 'description'],
 *   dataUtilsImports,
 * })
 * // Returns:
 * // buildCreateDataFragment: (data) => data
 * // buildUpdateDataFragment: (data) => data
 */
export function generateRelationBuildData(
  config: GenerateRelationBuildDataConfig,
): GenerateRelationBuildDataResult {
  const { prismaModel, inputFieldNames, dataUtilsImports } = config;

  // Find all relations that have at least one FK field in the input
  const relevantRelations = findRelevantRelations(prismaModel, inputFieldNames);

  // Extract all foreign key field names
  const foreignKeyFieldNames = extractForeignKeyFields(relevantRelations);

  // Generate both create and update buildData functions
  const createBody = generateBuildDataBody(
    foreignKeyFieldNames,
    'create',
    dataUtilsImports,
    relevantRelations,
    inputFieldNames,
  );
  const updateBody = generateBuildDataBody(
    foreignKeyFieldNames,
    'update',
    dataUtilsImports,
    relevantRelations,
    inputFieldNames,
  );

  // Both should have the same passthrough status since they use the same relations
  const passthrough = createBody.passthrough && updateBody.passthrough;

  return {
    createArgumentFragment: createBody.argumentFragment,
    createReturnFragment: createBody.returnFragment,
    updateArgumentFragment: updateBody.argumentFragment,
    updateReturnFragment: updateBody.returnFragment,
    buildCreateDataFragment: tsTemplate`(${createBody.argumentFragment}) => (${createBody.returnFragment})`,
    buildUpdateDataFragment: tsTemplate`(${updateBody.argumentFragment}) => (${updateBody.returnFragment})`,
    passthrough,
  };
}
