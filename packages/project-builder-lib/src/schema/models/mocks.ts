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

export function generateMockModelScalarField<
  TType extends ModelScalarFieldConfig['type'] = 'string',
>(
  field?: Partial<ModelScalarFieldConfigInput & { type: TType }>,
): ModelScalarFieldConfig & { type: TType } {
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
  } as ModelScalarFieldConfig & { type: TType };
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
