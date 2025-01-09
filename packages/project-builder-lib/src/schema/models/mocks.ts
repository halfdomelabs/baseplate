import type {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ModelUniqueConstraintConfig,
} from './index.js';

import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
  modelUniqueConstraintEntityType,
} from './index.js';

export function generateMockUniqueConstraint(
  constraint?: Partial<ModelUniqueConstraintConfig>,
): ModelUniqueConstraintConfig {
  return {
    id: modelUniqueConstraintEntityType.generateNewId(),
    fields: [],
    ...constraint,
  };
}

export function generateMockModelScalarField(
  field?: Partial<ModelScalarFieldConfig>,
): ModelScalarFieldConfig {
  return {
    id: modelScalarFieldEntityType.generateNewId(),
    name: 'mockField',
    type: 'string',
    ...field,
  };
}

export function generateMockModelRelationField(
  relation?: Partial<ModelRelationFieldConfig>,
): ModelRelationFieldConfig {
  return {
    id: modelLocalRelationEntityType.generateNewId(),
    foreignId: modelForeignRelationEntityType.generateNewId(),
    name: 'mockRelation',
    modelName: 'mockModel',
    foreignRelationName: 'mockForeignRelation',
    references: [],
    onDelete: 'Cascade',
    onUpdate: 'Restrict',
    ...relation,
  };
}

export function generateMockModel(model?: Partial<ModelConfig>): ModelConfig {
  return {
    id: modelEntityType.generateNewId(),
    name: 'mockModel',
    featureRef: 'mockFeature',
    model: {
      primaryKeyFieldRefs: [model?.model?.fields[0]?.id ?? ''],
      fields: [],
      ...model?.model,
    },
    ...model,
  };
}
