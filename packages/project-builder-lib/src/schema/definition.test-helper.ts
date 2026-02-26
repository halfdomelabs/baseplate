import { faker } from '@faker-js/faker';
import { capitalize } from 'es-toolkit';

import type { FeatureConfig } from './features/feature.js';
import type {
  ModelConfig,
  ModelConfigInput,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ModelScalarFieldConfigInput,
  ModelUniqueConstraintConfig,
} from './models/index.js';

import { createEmptyParserContext } from './creator/parser-context.test-helper.js';
import { featureEntityType } from './features/feature.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
  modelUniqueConstraintEntityType,
} from './models/index.js';
import { createModelSchema } from './models/models.js';

const modelSchema = createModelSchema(createEmptyParserContext());

export function createTestFeature(
  feature: Partial<FeatureConfig> = {},
): FeatureConfig {
  return {
    id: featureEntityType.generateNewId(),
    name: faker.word.noun(),
    ...feature,
  };
}

export function createTestModel(
  model: Partial<ModelConfigInput> = {},
): ModelConfig {
  const input: ModelConfigInput = {
    id: modelEntityType.generateNewId(),
    name: capitalize(faker.word.noun()),
    featureRef: 'mockFeature',
    ...model,
    model: {
      fields: [
        {
          id: modelScalarFieldEntityType.generateNewId(),
          name: 'id',
          type: 'uuid',
          options: { genUuid: true, default: '123' },
          isOptional: false,
        },
      ],
      primaryKeyFieldRefs: ['id'],
      ...model.model,
    },
    service: {
      create: { enabled: false },
      update: { enabled: false },
      delete: { enabled: false },
      transformers: [],
      ...model.service,
    },
  };
  return modelSchema.parse(input);
}

export function createTestScalarField<
  TType extends ModelScalarFieldConfig['type'] = 'string',
>(
  field: Partial<ModelScalarFieldConfigInput & { type: TType }> = {},
): ModelScalarFieldConfig & { type: TType } {
  return {
    id: modelScalarFieldEntityType.generateNewId(),
    name: faker.word.noun(),
    type: 'string',
    isOptional: false,
    ...field,
    options: {
      default: '123',
      ...field.options,
    },
  } as ModelScalarFieldConfig & { type: TType };
}

export function createTestRelationField(
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

export function createTestUniqueConstraint(
  constraint?: Partial<ModelUniqueConstraintConfig>,
): ModelUniqueConstraintConfig {
  return {
    id: modelUniqueConstraintEntityType.generateNewId(),
    fields: [],
    ...constraint,
  };
}
