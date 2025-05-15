import type {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ModelScalarFieldConfigInput,
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
  field?: Partial<ModelScalarFieldConfigInput>,
): ModelScalarFieldConfig {
  return {
    id: modelScalarFieldEntityType.generateNewId(),
    name: 'mockField',
    type: 'string',
    isOptional: false,
    ...field,
    options: {
      default: '',
      ...field?.options,
    },
  };
}

export function generateMockModelRelationField(
  relation?: Partial<ModelRelationFieldConfig>,
): ModelRelationFieldConfig {
  return {
    id: modelLocalRelationEntityType.generateNewId(),
    foreignId: modelForeignRelationEntityType.generateNewId(),
    name: 'mockRelation',
    modelRef: 'mockModel',
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
    service: {
      create: { enabled: false },
      update: { enabled: false },
      delete: { enabled: false },
      transformers: [],
      ...model?.service,
    },
    ...model,
  };
}
