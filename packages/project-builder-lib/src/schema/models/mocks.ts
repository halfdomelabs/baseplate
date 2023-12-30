import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ModelUniqueConstraintConfig,
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldType,
} from './index.js';

export function generateMockUniqueConstraint(
  constraint?: Partial<ModelUniqueConstraintConfig>,
): ModelUniqueConstraintConfig {
  return {
    name: 'mockConstraint',
    fields: [],
    ...constraint,
  };
}

export function generateMockModelScalarField(
  field?: Partial<ModelScalarFieldConfig>,
): ModelScalarFieldConfig {
  return {
    id: modelScalarFieldType.generateNewId(),
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
    feature: 'mockFeature',
    model: {
      fields: [],
      ...model?.model,
    },
    ...model,
  };
}
