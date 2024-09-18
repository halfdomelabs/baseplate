import { isEqual } from 'es-toolkit';

import { ModelUtils } from './model-utils.js';
import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ProjectDefinition,
} from '@src/schema/index.js';

function isScalarUnique(model: ModelConfig, fieldId: string): boolean {
  const primaryKeyFieldRefs = model.model.primaryKeyFieldRefs ?? [];
  const uniqueConstraints = model.model.uniqueConstraints ?? [];
  return (
    (primaryKeyFieldRefs.length === 1 &&
      primaryKeyFieldRefs.includes(fieldId)) ||
    uniqueConstraints.some(
      (c) => c.fields.length === 1 && c.fields[0].fieldRef === fieldId,
    )
  );
}

function areScalarsUnique(model: ModelConfig, fieldIds: string[]): boolean {
  const sortedFieldIds = fieldIds.toSorted();
  return (
    (isEqual(model.model.primaryKeyFieldRefs.toSorted(), sortedFieldIds) ||
      model.model.uniqueConstraints?.some((c) => {
        return isEqual(
          c.fields.map((f) => f.fieldRef).toSorted(),
          sortedFieldIds,
        );
      })) ??
    false
  );
}

function getRelationLocalFields(
  model: ModelConfig,
  relation: ModelRelationFieldConfig,
): ModelScalarFieldConfig[] {
  return relation.references.map((r) => {
    const field = model.model.fields?.find((f) => f.id === r.local);
    if (!field) {
      throw new Error(
        `Could not find field ${r.local} from relation ${relation.name} in model ${model.name}`,
      );
    }
    return field;
  });
}

function isRelationOptional(
  model: ModelConfig,
  relation: ModelRelationFieldConfig,
): boolean {
  const localFields = getRelationLocalFields(model, relation);
  return localFields.some((f) => f.isOptional);
}

function isRelationOneToOne(
  model: ModelConfig,
  relation: ModelRelationFieldConfig,
): boolean {
  const localFields = getRelationLocalFields(model, relation);
  const localFieldIds = localFields.map((f) => f.id).sort();
  // check if the local fields are a primary key or unique constraint
  return areScalarsUnique(model, localFieldIds);
}

function getModelFieldValidation(
  projectDefinition: ProjectDefinition,
  modelId: string,
  fieldId: string,
  preProcess?: boolean,
): string {
  const model = ModelUtils.byIdOrThrow(projectDefinition, modelId);
  const field = model.model.fields.find((f) => f.id === fieldId);
  if (!field) {
    throw new Error(`Field ${fieldId} not found in model ${model.name}`);
  }

  const nullishSuffix = field.isOptional ? '.nullish()' : '';

  if (field.type === 'int') {
    return `z.number().or(z.string()).pipe(z.coerce.number().finite().int())${nullishSuffix}`;
  }
  if (field.type === 'float') {
    return `z.number().or(z.string()).pipe(z.coerce.number().finite())${nullishSuffix}`;
  }

  function getModelValidator(modelField: ModelScalarFieldConfig): string {
    switch (modelField.type) {
      case 'boolean':
        return 'boolean()';
      case 'date':
        return 'string()';
      case 'int':
      case 'float':
        return 'number()';
      case 'dateTime':
      case 'string':
      case 'decimal':
      case 'uuid':
        return 'string()';
      default:
        throw new Error(`Unsupported validator for ${modelField.type}`);
    }
  }

  const validator = `z.${getModelValidator(field)}${nullishSuffix}`;
  if (!preProcess) {
    return validator;
  }
  return validator;
}

export const ModelFieldUtils = {
  isScalarUnique,
  areScalarsUnique,
  getRelationLocalFields,
  isRelationOptional,
  isRelationOneToOne,
  getModelFieldValidation,
};
