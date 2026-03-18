import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import {
  lowercaseFirstChar,
  quot,
  uppercaseFirstChar,
} from '@baseplate-dev/utils';

import type {
  PrismaOutputModel,
  PrismaOutputRelationField,
} from '#src/types/prisma-output.js';

import type { InputFieldDefinitionOutput } from '../_shared/field-definition-generators/types.js';
import type { DataUtilsImportsProvider } from '../data-utils/index.js';

import { buildTransformOperationParts } from '../_shared/build-data-helpers/build-transform-operation-parts.js';
import { generateExistingItemWhere } from '../_shared/build-data-helpers/generate-where-type.js';

interface WritePrismaDataNestedFieldInput {
  parentModel: PrismaOutputModel;
  nestedModel: PrismaOutputModel;
  relation: PrismaOutputRelationField;
  nestedFields: InputFieldDefinitionOutput[];
  dataUtilsImports: DataUtilsImportsProvider;
  /** Import fragment for the nested model's transformers variable (e.g., todoItemAttachmentTransformers) */
  nestedTransformersFragment?: TsCodeFragment;
}

/**
 * Creates a compareItem function for one-to-many relations.
 * Matches input items to existing items by their unique key fields.
 *
 * For models with simple ID:
 * Generates: (input, existing) => input.id === existing.id
 *
 * For composite keys:
 * Generates: (input, existing) => input.role === existing.role
 * (only compares the input-provided portion of the key)
 */
function createCompareItemFragment(
  nestedModel: PrismaOutputModel,
  relation: PrismaOutputRelationField,
  inputFieldNames: string[],
): TsCodeFragment | undefined {
  const { idFields } = nestedModel;
  if (!idFields || idFields.length === 0) return undefined;

  const relationFields = relation.fields ?? [];

  // Input ID fields = ID fields that come from user input (not relation FK)
  const inputIdFields = idFields.filter(
    (f) => inputFieldNames.includes(f) && !relationFields.includes(f),
  );

  if (inputIdFields.length === 0) return undefined;

  const comparisons = inputIdFields.map(
    (field) => `input.${field} === existing.${field}`,
  );

  return tsTemplate`(input, existing) => ${comparisons.join(' && ')}`;
}

/**
 * Generates a deleteRemoved function for one-to-many relations.
 * Uses Prisma deleteMany with OR clause.
 */
function createDeleteRemovedFragment(
  nestedModel: PrismaOutputModel,
  relation: PrismaOutputRelationField,
): TsCodeFragment {
  const modelVar = lowercaseFirstChar(nestedModel.name);
  const { idFields } = nestedModel;

  if (!idFields || idFields.length === 0) {
    throw new Error(
      `Nested model ${nestedModel.name} must have id fields for deleteRemoved`,
    );
  }

  const relationFields = relation.fields ?? [];

  // For simple single ID (not part of relation FK)
  if (idFields.length === 1 && !relationFields.includes(idFields[0])) {
    return tsTemplate`async (tx, removedItems) => {
      await tx.${modelVar}.deleteMany({
        where: { OR: removedItems.map((i) => ({ ${idFields[0]}: i.${idFields[0]} })) },
      });
    }`;
  }

  // For composite keys, map all ID fields
  const mapFields = idFields.map((f) => `${f}: i.${f}`).join(', ');

  return tsTemplate`async (tx, removedItems) => {
    await tx.${modelVar}.deleteMany({
      where: { OR: removedItems.map((i) => ({ ${mapFields} })) },
    });
  }`;
}

/**
 * Generates a processDelete function for one-to-one relations.
 * Uses Prisma deleteMany (idempotent) based on parent ID.
 */
function createProcessDeleteFragment(
  nestedModel: PrismaOutputModel,
  reverseRelation: PrismaOutputRelationField,
): TsCodeFragment {
  const modelVar = lowercaseFirstChar(nestedModel.name);
  const reverseFields = reverseRelation.fields ?? [];
  const reverseRefs = reverseRelation.references ?? [];

  // Build the where clause from the relation fields
  const whereEntries = reverseFields.map((field, i) => {
    const refField = reverseRefs[i];
    return `${field}: parent.${refField}`;
  });

  return tsTemplate`() => async (tx, parent) => {
    await tx.${modelVar}.deleteMany({ where: { ${whereEntries.join(', ')} } });
  }`;
}

/**
 * Builds the parent connect fragment used in processCreate data.
 * Generates: `relationName: { connect: { field1: parent.field1, ... } }`
 */
function buildParentConnectEntry(reverseRelation: PrismaOutputRelationField): {
  key: string;
  value: TsCodeFragment;
} {
  const reverseFields = reverseRelation.fields ?? [];
  const reverseRefs = reverseRelation.references ?? [];
  const connectEntries = reverseFields.map((_, i) => {
    const refField = reverseRefs[i];
    return `${refField}: parent.${refField}`;
  });

  return {
    key: reverseRelation.name,
    value: tsTemplate`{ connect: { ${connectEntries.join(', ')} } }`,
  };
}

/**
 * Generates processCreate and processUpdate for the SIMPLE path (no sub-transformers).
 * Uses the shared buildTransformOperationParts for FK handling.
 */
function createSimpleProcessFunctions(
  input: WritePrismaDataNestedFieldInput,
  reverseRelation: PrismaOutputRelationField,
): {
  processCreateFragment: TsCodeFragment;
  processUpdateFragment: TsCodeFragment;
} {
  const { nestedModel, nestedFields, dataUtilsImports } = input;
  const modelVar = lowercaseFirstChar(nestedModel.name);
  const parentConnect = buildParentConnectEntry(reverseRelation);
  const whereExpr = generateExistingItemWhere(nestedModel);

  // Use shared helper for field categorization, destructuring, and data object building
  const createParts = buildTransformOperationParts({
    fields: nestedFields,
    prismaModel: nestedModel,
    dataUtilsImports,
    operationType: 'create',
    inputVarName: 'itemInput',
    additionalDataEntries: { [parentConnect.key]: parentConnect.value },
  });

  const updateParts = buildTransformOperationParts({
    fields: nestedFields,
    prismaModel: nestedModel,
    dataUtilsImports,
    operationType: 'update',
    inputVarName: 'itemInput',
    existingItemVarName: 'existingItem',
  });

  let processCreateFragment: TsCodeFragment;
  let processUpdateFragment: TsCodeFragment;

  if (createParts.hasDestructure) {
    processCreateFragment = tsTemplate`(itemInput) => async (tx, parent) => {
      ${createParts.inputDestructureFragment}
      await tx.${modelVar}.create({
        data: ${createParts.prismaDataFragment},
      });
    }`;
  } else {
    processCreateFragment = tsTemplate`(itemInput) => async (tx, parent) => {
      await tx.${modelVar}.create({
        data: ${createParts.prismaDataFragment},
      });
    }`;
  }

  if (updateParts.hasDestructure) {
    processUpdateFragment = tsTemplate`(itemInput, existingItem) => async (tx) => {
      ${updateParts.inputDestructureFragment}
      await tx.${modelVar}.update({
        where: ${whereExpr},
        data: ${updateParts.prismaDataFragment},
      });
    }`;
  } else {
    processUpdateFragment = tsTemplate`(itemInput, existingItem) => async (tx) => {
      await tx.${modelVar}.update({
        where: ${whereExpr},
        data: ${updateParts.prismaDataFragment},
      });
    }`;
  }

  return { processCreateFragment, processUpdateFragment };
}

/**
 * Generates processCreate and processUpdate for the TRANSFORM path (has sub-transformers).
 * Uses prepareTransformers + executeTransformPlan inside the deferred operations.
 */
function createTransformProcessFunctions(
  input: WritePrismaDataNestedFieldInput,
  reverseRelation: PrismaOutputRelationField,
): {
  processCreateFragment: TsCodeFragment;
  processUpdateFragment: TsCodeFragment;
} {
  const {
    nestedModel,
    nestedFields,
    dataUtilsImports,
    nestedTransformersFragment,
  } = input;
  const modelVar = lowercaseFirstChar(nestedModel.name);
  const parentConnect = buildParentConnectEntry(reverseRelation);
  const whereExpr = generateExistingItemWhere(nestedModel);

  if (!nestedTransformersFragment) {
    throw new Error(
      `Nested model ${nestedModel.name} has sub-transform-fields but no transformers fragment. ` +
        `Ensure the nested model has its own prisma-data-service.`,
    );
  }

  // Build operation parts for create
  const createParts = buildTransformOperationParts({
    fields: nestedFields,
    prismaModel: nestedModel,
    dataUtilsImports,
    operationType: 'create',
    inputVarName: 'itemInput',
    transformersVarFragment: nestedTransformersFragment,
    additionalDataEntries: { [parentConnect.key]: parentConnect.value },
  });

  // Build operation parts for update
  // Use loadExistingVarName: 'existingItem' because in processUpdate,
  // loadExisting should reference the existing nested item, not the parent's 'where'
  const updateParts = buildTransformOperationParts({
    fields: nestedFields,
    prismaModel: nestedModel,
    dataUtilsImports,
    operationType: 'update',
    inputVarName: 'itemInput',
    transformersVarFragment: nestedTransformersFragment,
    existingItemVarName: 'existingItem',
    loadExistingVarName: 'existingItem',
  });

  // Safe to assert: we only enter this path when hasTransformFields is true
  // and we pass transformersVarFragment, so these will always be defined
  const createTransformers = createParts.transformersObjectFragment!;
  const updateTransformers = updateParts.transformersObjectFragment!;

  // processCreate: prepare transformers then execute inside deferred
  const processCreateFragment = tsTemplate`(itemInput, { serviceContext }) => async (tx, parent) => {
    ${createParts.inputDestructureFragment}

    const plan = await ${dataUtilsImports.prepareTransformers.fragment()}({
      transformers: ${createTransformers},
      serviceContext,
    });

    await ${dataUtilsImports.executeTransformPlan.fragment()}(plan, {
      tx,
      execute: async (${createParts.hasTransformFields ? '{ transformed }' : ''}) =>
        tx.${modelVar}.create({
          data: ${createParts.prismaDataFragment},
        }),
    });
  }`;

  // processUpdate: prepare transformers then execute inside deferred
  const processUpdateFragment = tsTemplate`(itemInput, existingItem, { serviceContext }) => async (tx) => {
    ${updateParts.inputDestructureFragment}

    const plan = await ${dataUtilsImports.prepareTransformers.fragment()}({
      transformers: ${updateTransformers},
      serviceContext,
    });

    await ${dataUtilsImports.executeTransformPlan.fragment()}(plan, {
      tx,
      execute: async (${updateParts.hasTransformFields ? '{ transformed }' : ''}) =>
        tx.${modelVar}.update({
          where: ${whereExpr},
          data: ${updateParts.prismaDataFragment},
        }),
    });
  }`;

  return { processCreateFragment, processUpdateFragment };
}

/**
 * Writes a nested field transformer definition (oneToOneTransformer or oneToManyTransformer).
 *
 * Generates:
 * - schemaFragment: Zod schema for the fieldSchemas object
 * - transformer.fragment: oneToOneTransformer({...}) or oneToManyTransformer({...})
 *
 * For nested entities with sub-transform-fields (e.g., file fields), generates
 * processCreate/processUpdate that use prepareTransformers + executeTransformPlan.
 */
export function writePrismaDataNestedField(
  input: WritePrismaDataNestedFieldInput,
): InputFieldDefinitionOutput {
  const { parentModel, nestedModel, relation, nestedFields, dataUtilsImports } =
    input;

  const nestedFieldNames = nestedFields.map((f) => f.name);
  const zFrag = TsCodeUtils.importFragment('z', 'zod');

  // Build the Zod schema for the nested entity's input
  const nestedSchemaEntries = TsCodeUtils.mergeFragmentsAsObject(
    Object.fromEntries(nestedFields.map((f) => [f.name, f.schemaFragment])),
  );

  // Build the Zod schema fragment for the fieldSchemas object
  const itemSchema = tsTemplate`${zFrag}.object(${nestedSchemaEntries})`;
  const schemaFragment = relation.isList
    ? tsTemplate`${zFrag}.array(${itemSchema}).optional()`
    : tsTemplate`${itemSchema}.nullish()`;

  // Find reverse relation (nested model → parent model)
  const reverseRelation = nestedModel.fields.find(
    (f): f is PrismaOutputRelationField =>
      f.type === 'relation' &&
      f.relationName === relation.relationName &&
      f.modelType === parentModel.name,
  );

  if (!reverseRelation) {
    throw new Error(
      `Reverse relation ${relation.name} not found on model ${nestedModel.name}`,
    );
  }

  // Choose process function generation based on whether nested has sub-transformers
  const hasSubTransformers = nestedFields.some((f) => f.isTransformField);

  const { processCreateFragment, processUpdateFragment } = hasSubTransformers
    ? createTransformProcessFunctions(input, reverseRelation)
    : createSimpleProcessFunctions(input, reverseRelation);

  let transformerFragment: TsCodeFragment;

  if (relation.isList) {
    // oneToManyTransformer
    const compareItemFragment = createCompareItemFragment(
      nestedModel,
      reverseRelation,
      nestedFieldNames,
    );
    const deleteRemovedFragment = createDeleteRemovedFragment(
      nestedModel,
      reverseRelation,
    );

    const configEntries: Record<string, TsCodeFragment | string> = {
      parentModel: quot(lowercaseFirstChar(parentModel.name)),
      model: quot(lowercaseFirstChar(nestedModel.name)),
      schema: itemSchema,
      processCreate: processCreateFragment,
      deleteRemoved: deleteRemovedFragment,
    };

    if (compareItemFragment) {
      configEntries['compareItem'] = compareItemFragment;
    }

    configEntries['processUpdate'] = processUpdateFragment;

    const configObj = TsCodeUtils.mergeFragmentsAsObject(configEntries);
    transformerFragment = tsTemplate`${dataUtilsImports.oneToManyTransformer.fragment()}(${configObj})`;
  } else {
    // oneToOneTransformer
    const processDeleteFragment = createProcessDeleteFragment(
      nestedModel,
      reverseRelation,
    );

    const configEntries: Record<string, TsCodeFragment | string> = {
      parentModel: quot(lowercaseFirstChar(parentModel.name)),
      model: quot(lowercaseFirstChar(nestedModel.name)),
      schema: itemSchema,
      processCreate: processCreateFragment,
      processUpdate: processUpdateFragment,
      processDelete: processDeleteFragment,
    };

    const configObj = TsCodeUtils.mergeFragmentsAsObject(configEntries);
    transformerFragment = tsTemplate`${dataUtilsImports.oneToOneTransformer.fragment()}(${configObj})`;
  }

  // Build loadExisting query fragment for the forUpdate pattern
  const nestedModelVar = lowercaseFirstChar(nestedModel.name);
  const reverseFields = reverseRelation.fields ?? [];
  const reverseRefs = reverseRelation.references ?? [];
  const whereEntries = reverseFields
    .map((field, i) => `${field}: where.${reverseRefs[i]}`)
    .join(', ');

  const findMethod = relation.isList ? 'findMany' : 'findUnique';
  const loadExistingFragment = tsTemplate`prisma.${nestedModelVar}.${findMethod}({ where: { ${whereEntries} } })`;

  return {
    name: relation.name,
    schemaFragment,
    transformer: {
      fragment: transformerFragment,
      needsExistingItem: true,
      forUpdatePattern: {
        kind: 'loadExisting',
        loadExistingFragment,
        loadExistingInfo: {
          modelVar: nestedModelVar,
          findMethod,
          whereEntries: reverseFields.map((field, i) => ({
            field,
            referenceField: reverseRefs[i],
          })),
        },
      },
    },
    isTransformField: true,
    outputDtoField: {
      name: relation.name,
      type: 'nested',
      isPrismaType: false,
      isOptional: true,
      isNullable: false,
      isList: relation.isList,
      nestedType: {
        name: `${uppercaseFirstChar(parentModel.name)}${uppercaseFirstChar(relation.name)}NestedInput`,
        fields: nestedFields.map((f) => f.outputDtoField),
      },
    },
  };
}
