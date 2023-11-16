import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ModelUniqueConstraintConfig,
} from './index.js';
import { randomUid } from '@src/utils/randomUid.js';

export function generateMockUniqueConstraint(
  constraint?: Partial<ModelUniqueConstraintConfig>,
): ModelUniqueConstraintConfig {
  return {
    uid: randomUid(),
    name: 'mockConstraint',
    fields: [],
    ...constraint,
  };
}

export function generateMockModelScalarField(
  field?: Partial<ModelScalarFieldConfig>,
): ModelScalarFieldConfig {
  return {
    uid: randomUid(),
    name: 'mockField',
    type: 'string',
    ...field,
  };
}

export function generateMockModelRelationField(
  relation?: Partial<ModelRelationFieldConfig>,
): ModelRelationFieldConfig {
  return {
    uid: randomUid(),
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
    uid: randomUid(),
    name: 'mockModel',
    feature: 'mockFeature',
    model: {
      fields: [],
      ...model?.model,
    },
    ...model,
  };
}
