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

import { generateRelationBuildData } from '../_shared/build-data-helpers/generate-relation-build-data.js';

interface WritePrismaDataNestedFieldInput {
  parentModel: PrismaOutputModel;
  nestedModel: PrismaOutputModel;
  relation: PrismaOutputRelationField;
  nestedFields: InputFieldDefinitionOutput[];
  dataUtilsImports: DataUtilsImportsProvider;
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
 * Generates processCreate and processUpdate functions for nested relations.
 * These return deferred operations that run inside the parent's transaction.
 */
function createProcessFunctions(
  input: WritePrismaDataNestedFieldInput,
  reverseRelation: PrismaOutputRelationField,
): {
  processCreateFragment: TsCodeFragment;
  processUpdateFragment: TsCodeFragment;
} {
  const { nestedModel, nestedFields, dataUtilsImports } = input;
  const modelVar = lowercaseFirstChar(nestedModel.name);
  const nestedFieldNames = nestedFields.map((f) => f.name);

  // Get FK → relation build data for the nested model
  const {
    createArgumentFragment: fkArgCreate,
    createReturnFragment: fkRetCreate,
    updateArgumentFragment: fkArgUpdate,
    updateReturnFragment: fkRetUpdate,
    passthrough: noFkRelations,
  } = generateRelationBuildData({
    prismaModel: nestedModel,
    inputFieldNames: nestedFieldNames,
    dataUtilsImports,
    dataName: 'rest',
  });

  // Build the parent connect fragment from the reverse relation
  const reverseFields = reverseRelation.fields ?? [];
  const reverseRefs = reverseRelation.references ?? [];
  const connectEntries = reverseFields.map((_, i) => {
    const refField = reverseRefs[i];
    return `${refField}: parent.${refField}`;
  });
  const parentConnectFragment = tsTemplate`${reverseRelation.name}: { connect: { ${connectEntries.join(', ')} } }`;

  // Check if nested fields have sub-transformers
  const hasSubTransformers = nestedFields.some((f) => f.isTransformField);

  let processCreateFragment: TsCodeFragment;
  let processUpdateFragment: TsCodeFragment;

  if (hasSubTransformers) {
    // Complex path: nested fields have their own transformers (e.g., file fields inside nested)
    // TODO: Generate prepareTransformers + executeTransformPlan for sub-transformers
    // For now, fall through to the simple path
  }

  // Simple path: no sub-transformers, direct Prisma calls
  if (noFkRelations) {
    processCreateFragment = tsTemplate`(itemInput) => async (tx, parent) => {
      await tx.${modelVar}.create({
        data: {
          ...itemInput,
          ${parentConnectFragment},
        },
      });
    }`;

    processUpdateFragment = tsTemplate`(itemInput, existingItem) => async (tx) => {
      await tx.${modelVar}.update({
        where: { id: existingItem.id },
        data: itemInput,
      });
    }`;
  } else {
    processCreateFragment = tsTemplate`(itemInput) => async (tx, parent) => {
      const ${fkArgCreate} = itemInput;
      await tx.${modelVar}.create({
        data: {
          ...${fkRetCreate},
          ${parentConnectFragment},
        },
      });
    }`;

    processUpdateFragment = tsTemplate`(itemInput, existingItem) => async (tx) => {
      const ${fkArgUpdate} = itemInput;
      await tx.${modelVar}.update({
        where: { id: existingItem.id },
        data: ${fkRetUpdate},
      });
    }`;
  }

  return { processCreateFragment, processUpdateFragment };
}

/**
 * Writes a nested field transformer definition (oneToOneTransformer or oneToManyTransformer).
 *
 * Generates:
 * - schemaFragment: Zod schema for the fieldSchemas object
 * - transformer.fragment: oneToOneTransformer({...}) or oneToManyTransformer({...})
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

  // Generate process functions
  const { processCreateFragment, processUpdateFragment } =
    createProcessFunctions(input, reverseRelation);

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
