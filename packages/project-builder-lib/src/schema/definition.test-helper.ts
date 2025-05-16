import { faker } from '@faker-js/faker';
import { capitalize } from 'es-toolkit';

import type { FeatureConfig } from './features/feature.js';
import type { ModelConfig, ModelScalarFieldConfig } from './models/index.js';

import { featureEntityType } from './features/feature.js';
import { modelEntityType, modelScalarFieldEntityType } from './models/index.js';

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
  featureId: string,
  model: Partial<ModelConfig> = {},
): ModelConfig {
  return {
    id: modelEntityType.generateNewId(),
    name: capitalize(faker.word.noun()),
    featureRef: featureId,
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
    ...model,
  };
}

export function createTestScalarField(
  field: Partial<ModelScalarFieldConfig> = {},
): ModelScalarFieldConfig {
  return {
    id: modelScalarFieldEntityType.generateNewId(),
    name: faker.word.noun(),
    type: 'string',
    isOptional: false,
    options: {
      default: '123',
      ...field.options,
    },
    ...field,
  };
}
