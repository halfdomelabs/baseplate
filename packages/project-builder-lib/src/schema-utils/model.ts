import _ from 'lodash';

import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
} from '../schema/index.js';

export function isFieldUnique(field: ModelScalarFieldConfig): boolean {
  return !!field.isId || !!field.isUnique;
}

export function getModelLocalFields(
  model: ModelConfig,
  relation: ModelRelationFieldConfig,
): ModelScalarFieldConfig[] {
  return relation.references.map((r) => {
    const field = model.model.fields?.find((f) => f.name === r.local);
    if (!field) {
      throw new Error(
        `Could not find field ${r.local} from relation ${relation.name} in model ${model.name}`,
      );
    }
    return field;
  });
}

export function isModelRelationOptional(
  model: ModelConfig,
  relation: ModelRelationFieldConfig,
): boolean {
  const localFields = getModelLocalFields(model, relation);
  return localFields.some((f) => f.isOptional);
}

export function isModelRelationOneToOne(
  model: ModelConfig,
  relation: ModelRelationFieldConfig,
): boolean {
  const localFields = getModelLocalFields(model, relation);
  if (localFields.length === 1 && isFieldUnique(localFields[0])) {
    return true;
  }
  const localFieldNames = localFields.map((f) => f.name).sort();
  // check if the local fields are a primary key or unique constraint
  return (
    (_.isEqual([...(model.model.primaryKeys ?? [])].sort(), localFieldNames) ||
      model.model.uniqueConstraints?.some((c) => {
        return _.isEqual(c.fields.map((f) => f.name).sort(), localFieldNames);
      })) ??
    false
  );
}
