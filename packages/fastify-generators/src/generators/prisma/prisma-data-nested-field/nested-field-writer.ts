import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
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
  /** The fragment referencing the existing fields array (otherwise we inline the fields) */
  dataServiceFieldsFragment?: TsCodeFragment;
  nestedFields: InputFieldDefinitionOutput[];
  dataUtilsImports: DataUtilsImportsProvider;
}

/**
 * Creates a where unique function for parent model config.
 * Generates: (parentModel) => ({ id: parentModel.id })
 *
 * @param model - The parent Prisma model
 * @param argName - The argument name for the function (default: 'value')
 * @returns TypeScript code fragment for the where unique function
 */
function createPrismaWhereUniqueFunction(
  model: PrismaOutputModel,
  argName = 'value',
): TsCodeFragment {
  const primaryKeys = model.idFields;

  if (!primaryKeys) {
    throw new Error(
      `Primary keys on model ${model.name} are required to generate where unique function`,
    );
  }

  return tsTemplate`(${argName}) => ${TsCodeUtils.mergeFragmentsAsObject(
    Object.fromEntries(primaryKeys.map((k) => [k, `${argName}.${k}`])),
    { wrapWithParenthesis: true },
  )}`;
}

/**
 * Creates a where unique function for one-to-one nested relations.
 * Maps parent model fields to nested model's unique constraint based on relation field mapping.
 *
 * For example, UserProfile.userId unique references User.id:
 * Generates: (parentModel) => ({ userId: parentModel.id })
 *
 * @param relation - The relation field from nested model to parent
 * @param nestedModel - The nested Prisma model
 * @returns TypeScript code fragment for the where unique function
 */
function createOneToOneWhereUniqueFunction(
  relation: PrismaOutputRelationField,
  nestedModel: PrismaOutputModel,
): TsCodeFragment {
  const relationFields = relation.fields ?? [];
  const referencedFields = relation.references ?? [];

  if (relationFields.length === 0 || referencedFields.length === 0) {
    throw new Error(
      `Relation ${relation.name} on model ${nestedModel.name} must have fields and references defined`,
    );
  }

  if (relationFields.length !== referencedFields.length) {
    throw new Error(
      `Relation ${relation.name} fields and references must have the same length`,
    );
  }

  // Map parent model fields to nested model fields
  // E.g., { userId: parentModel.id } for UserProfile -> User relation
  const whereUniqueObject = Object.fromEntries(
    relationFields.map((relationField, index) => {
      const referencedField = referencedFields[index];
      return [relationField, `parentModel.${referencedField}`];
    }),
  );

  return tsTemplate`(parentModel) => ${TsCodeUtils.mergeFragmentsAsObject(
    whereUniqueObject,
    { wrapWithParenthesis: true },
  )}`;
}

/**
 * Creates a where unique function for one-to-many nested relations.
 * Combines input fields with parent model fields to form a composite unique constraint.
 *
 * For example, UserRole with @@id([userId, role]) where role is in input:
 * Generates: (input, parentModel) => ({ userId_role: { userId: parentModel.id, role: input.role } })
 *
 * For simple cases like UserImage with just id in input:
 * Generates: (input) => ({ id: input.id })
 *
 * @param nestedModel - The nested Prisma model
 * @param relation - The relation field from nested model to parent
 * @param inputFieldNames - Field names that are in the input
 * @param parentModel - The parent Prisma model
 * @returns TypeScript code fragment for the where unique function
 */
function createOneToManyWhereUniqueFunction(
  nestedModel: PrismaOutputModel,
  relation: PrismaOutputRelationField,
  inputFieldNames: string[],
): TsCodeFragment {
  const { idFields } = nestedModel;

  if (!idFields || idFields.length === 0) {
    throw new Error(
      `Nested model ${nestedModel.name} must have id fields for one-to-many relation`,
    );
  }

  const relationFields = relation.fields ?? [];
  const referencedFields = relation.references ?? [];

  // Build the where unique object, determining if each field comes from input or parent
  const whereFields: Record<string, string> = {};

  for (const idField of idFields) {
    // Check if this field is a relation field (comes from parent)
    const relationFieldIndex = relationFields.indexOf(idField);

    if (relationFieldIndex !== -1) {
      // Field comes from parent model via relation
      const referencedField = referencedFields[relationFieldIndex];
      whereFields[idField] = `parentModel.${referencedField}`;
    } else if (inputFieldNames.includes(idField)) {
      // Field comes from input
      whereFields[idField] = `input.${idField}`;
    } else {
      throw new Error(
        `ID field ${idField} of ${nestedModel.name} is not in input fields or relation fields`,
      );
    }
  }

  const inputIdFields = idFields.filter((f) => inputFieldNames.includes(f));

  // Check if all fields come from input (no parent dependency)
  const allFromInput = idFields.length === inputIdFields.length;

  // Generate the where unique object
  const whereUniqueObj = TsCodeUtils.mergeFragmentsAsObject(whereFields, {
    wrapWithParenthesis: true,
  });

  // Create a conditional for whether the input field sugggests the object has a prior value
  const hasExistingConditional = inputIdFields
    .map((field) => `input.${field}`)
    .join('&&');

  // For composite keys, wrap in composite key syntax
  if (idFields.length > 1) {
    const compositeKey = idFields.join('_');
    const compositeWhereUnique = TsCodeUtils.mergeFragmentsAsObject(
      {
        [compositeKey]: whereUniqueObj,
      },
      { wrapWithParenthesis: true },
    );

    const conditionalWhereUnique = tsTemplate`${hasExistingConditional} ? ${compositeWhereUnique} : undefined`;

    return allFromInput
      ? tsTemplate`(input) => ${conditionalWhereUnique}`
      : tsTemplate`(input, parentModel) => ${conditionalWhereUnique}`;
  }

  const conditionalWhereUniqueObj = tsTemplate`${hasExistingConditional} ? ${whereUniqueObj} : undefined`;

  // For single field, just return the field mapping
  return allFromInput
    ? tsTemplate`(input) => ${conditionalWhereUniqueObj}`
    : tsTemplate`(input, parentModel) => ${conditionalWhereUniqueObj}`;
}

export function writeParentModelConfigFragment({
  parentModel,
  dataUtilsImports,
}: WritePrismaDataNestedFieldInput): TsCodeFragment {
  const whereUniqueFunction = createPrismaWhereUniqueFunction(parentModel);

  return tsTemplate`const parentModel = ${dataUtilsImports.createParentModelConfig.fragment()}(${quot(lowercaseFirstChar(parentModel.name))}, ${whereUniqueFunction})`;
}

export function writePrismaDataNestedField(
  input: WritePrismaDataNestedFieldInput,
): InputFieldDefinitionOutput {
  const {
    parentModel,
    nestedModel,
    relation,
    nestedFields,
    dataServiceFieldsFragment,
    dataUtilsImports,
  } = input;

  const parentModelConfigFrag = writeParentModelConfigFragment(input);
  const fieldConstructor = relation.isList
    ? dataUtilsImports.nestedOneToManyField
    : dataUtilsImports.nestedOneToOneField;

  const nestedFieldNames = nestedFields.map((f) => f.name);
  const pickedFieldsFragment = dataServiceFieldsFragment
    ? tsTemplateWithImports([
        tsImportBuilder(['pick']).from('es-toolkit'),
      ])`pick(${dataServiceFieldsFragment}, ${JSON.stringify(nestedFieldNames)} as const)`
    : TsCodeUtils.mergeFragmentsAsObject(
        Object.fromEntries(nestedFields.map((f) => [f.name, f.fragment])),
      );

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

  // Generate the appropriate getWhereUnique function based on relation type
  const getWhereUniqueFragment = relation.isList
    ? createOneToManyWhereUniqueFunction(
        nestedModel,
        reverseRelation,
        nestedFieldNames,
      )
    : createOneToOneWhereUniqueFunction(reverseRelation, nestedModel);

  const fieldOptions = TsCodeUtils.mergeFragmentsAsObject({
    parentModel: 'parentModel',
    model: quot(lowercaseFirstChar(nestedModel.name)),
    relationName: quot(reverseRelation.name),
    fields: pickedFieldsFragment,
    getWhereUnique: getWhereUniqueFragment,
    buildData: generateRelationBuildData({
      prismaModel: nestedModel,
      inputFieldNames: nestedFieldNames,
      operationType: 'upsert',
      dataUtilsImports,
    }).buildDataFunctionFragment,
  });

  const fragment = tsTemplateWithImports([], {
    hoistedFragments: [
      { ...parentModelConfigFrag, key: 'parent-model-config' },
    ],
  })`
    ${fieldConstructor.fragment()}(${fieldOptions})
  `;

  return {
    name: relation.name,
    fragment,
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
